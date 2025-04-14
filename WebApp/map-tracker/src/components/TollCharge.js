import React, { useEffect, useState } from "react";
import { get, ref, update } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Checkbox,
} from "@mui/material";

const HighwayDistanceTable = () => {
  const { userId } = useAuth();

  const [vehicleNumbers, setVehicleNumbers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [unpaidRecords, setUnpaidRecords] = useState([]);
  const [paidRecords, setPaidRecords] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch vehicle numbers
  useEffect(() => {
    if (!userId) return;

    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const vehiclesRef = ref(database, `location/${userId}/coordinates`);
        const snapshot = await get(vehiclesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const vehicles = Object.keys(data).filter((key) => key !== "0");
          setVehicleNumbers(vehicles);
        } else {
          setVehicleNumbers([]);
        }
      } catch (err) {
        console.error("Error fetching vehicle numbers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [userId]);

  // Fetch records after vehicle selection
  useEffect(() => {
    if (!selectedVehicle) return;

    const fetchRecords = async () => {
      setLoading(true);
      try {
        const vehicleRef = ref(database, `location/${userId}/coordinates/${selectedVehicle}`);
        const snapshot = await get(vehicleRef);
        const unpaid = [];
        const paid = [];

        if (snapshot.exists()) {
          const allDates = snapshot.val();

          for (const date in allDates) {
            const entry = allDates[date];
            const meters = entry.todayTotalHighwayDistance ?? 0;
            const km = (meters / 1000).toFixed(2);
            const price = (km * 1).toFixed(2); // ₹1 per km

            if (entry.tollPayed) {
              paid.push({ date, distance: entry.paidDistance ?? "0.00", price: entry.paidAmount ?? "0.00" });
            } else {
              unpaid.push({ date, distance: km, price });
            }
          }
        }

        const sortByDateAsc = (arr) =>
          arr.sort((a, b) => {
            const [d1, m1, y1] = a.date.split("-").map(Number);
            const [d2, m2, y2] = b.date.split("-").map(Number);
            return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
          });
        
        setUnpaidRecords(sortByDateAsc(unpaid));
        setPaidRecords(sortByDateAsc(paid));        
        setSelectedDates([]);
        setShowCheckboxes(false);
        setPaymentStatus("");

        // Fetch wallet balance
        const walletRef = ref(database, `users/${userId}/walletBalance`);
        const walletSnap = await get(walletRef);
        if (walletSnap.exists()) {
          setWalletBalance(walletSnap.val());
        } else {
          setWalletBalance(0);
        }
      } catch (err) {
        console.error("Error fetching vehicle data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [selectedVehicle, userId]);

  const handleCheckboxChange = (date) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  
  const totalAmount = selectedDates.reduce((sum, date) => {
    const record = unpaidRecords.find((r) => r.date === date);
    return sum + (record ? parseFloat(record.price) : 0);
  }, 0);
  

  const handleProceedToPay = async () => {
    if (walletBalance < totalAmount) {
      setPaymentStatus("Insufficient balance");
      return;
    }

    try {
      const newBalance = walletBalance - totalAmount;

      // Update wallet
      const walletRef = ref(database, `users/${userId}`);
      await update(walletRef, { walletBalance: newBalance });

      // Update each selected date
      const updates = selectedDates.map(async (date) => {
        const record = unpaidRecords.find((r) => r.date === date);
        const distanceRef = ref(database, `location/${userId}/coordinates/${selectedVehicle}/${date}`);
        await update(distanceRef, {
          paidDistance: record.distance,
          paidAmount: record.price,
          todayTotalHighwayDistance: 0,
          tollPayed: true,
        });
      });

      await Promise.all(updates);
      setWalletBalance(newBalance);
      setPaymentStatus("Payment successful");
      setSelectedDates([]);
      setShowCheckboxes(false);

      // Refresh records
      const refreshRef = ref(database, `location/${userId}/coordinates/${selectedVehicle}`);
      const refreshedSnapshot = await get(refreshRef);
      const updatedUnpaid = [];
      const updatedPaid = [];

      if (refreshedSnapshot.exists()) {
        const all = refreshedSnapshot.val();
        for (const date in all) {
          const entry = all[date];
          const km = (entry.todayTotalHighwayDistance ?? 0) / 1000;
          const distance = km.toFixed(2);
          const price = (km * 1).toFixed(2);

          if (entry.tollPayed) {
            updatedPaid.push({
              date,
              distance: entry.paidDistance ?? "0.00",
              price: entry.paidAmount ?? "0.00",
            });
          } else {
            updatedUnpaid.push({ date, distance, price });
          }
        }
      }

      setUnpaidRecords(updatedUnpaid);
      setPaidRecords(updatedPaid);
    } catch (err) {
      console.error("Payment failed:", err);
      setPaymentStatus("Payment failed");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", pt: 10, px: 2, textAlign: "center" }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Highway Distance Records
      </Typography>
  
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <>
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Select Vehicle</InputLabel>
            <Select
              value={selectedVehicle}
              label="Select Vehicle"
              onChange={(e) => {
                setSelectedVehicle(e.target.value);
              }}
            >
              {vehicleNumbers.map((veh, idx) => (
                <MenuItem key={idx} value={veh}>
                  {veh}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
  
          {selectedVehicle && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 4 }}>
                <strong>💰 Wallet Balance:</strong> ₹{Number(walletBalance).toFixed(2)}
              </Typography>
  
              <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#fff3e0" }}>
                    <TableRow>
                      {showCheckboxes && <TableCell />}
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Distance (km)</strong></TableCell>
                      <TableCell><strong>Price (₹)</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unpaidRecords.map((row, idx) => (
                      <TableRow key={idx}>
                        {showCheckboxes && (
                          <TableCell>
                            <Checkbox
                              checked={selectedDates.includes(row.date)}
                              onChange={() => handleCheckboxChange(row.date)}
                            />
                          </TableCell>
                        )}
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.distance}</TableCell>
                        <TableCell>{row.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
  
              {!showCheckboxes ? (
                <Button
                  variant="contained"
                  sx={{ mt: 3 }}
                  onClick={() => setShowCheckboxes(true)}
                  disabled={unpaidRecords.length === 0}
                >
                  Pay Toll
                </Button>
              ) : (
                <>
                  
                  <Typography sx={{ mt: 3 }}>
                  <strong>Total Amount:</strong> ₹{totalAmount.toFixed(2)}
                  </Typography>

                  {walletBalance < Number(totalAmount.toFixed(2)) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Insufficient wallet balance. Please add funds to proceed.
                  </Alert>
                  )}

  
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ mt: 2 }}
                    onClick={handleProceedToPay}
                    // disabled={
                    //   selectedDates.length === 0 ||
                    //   totalAmount <= 0 ||
                    //   walletBalance < totalAmount
                    // }
                    disabled={
                      selectedDates.length === 0 ||
                      totalAmount <= 0 ||
                      walletBalance < Number(totalAmount.toFixed(2))
                    }                    
                  >
                    Proceed to Pay
                  </Button>
                </>
              )}
  
              {paymentStatus && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={
                    paymentStatus === "Payment successful"
                      ? "success"
                      : paymentStatus === "Insufficient balance"
                      ? "warning"
                      : "error"
                  }>
                    {paymentStatus}
                  </Alert>
                </Box>
              )}
  
              {paidRecords.length > 0 && (
                <Box sx={{ mt: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Toll Payment History
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#e8f5e9" }}>
                        <TableRow>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Distance (km)</strong></TableCell>
                          <TableCell><strong>Amount Paid (₹)</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paidRecords.map((entry, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell>{entry.distance}</TableCell>
                            <TableCell>{entry.price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
  
};

export default HighwayDistanceTable;

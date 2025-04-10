import React, { useEffect, useState } from "react";
import { get, ref, set } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox
} from "@mui/material";

const PenaltyTable = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [penaltyDetails, setPenaltyDetails] = useState([]);
  const [selectedPenalties, setSelectedPenalties] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalSelectedAmount, setTotalSelectedAmount] = useState(0); // Total selected amount 
  const [paidPenalties, setPaidPenalties] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0); //State to hold wallet balance

  const { userId } = useAuth();

useEffect(() => {
    const fetchDates = async () => {
      if (userId) {
        try {
          const penaltyRef = ref(database, `penalties/${userId}`);
          const snapshot = await get(penaltyRef);
  
          if (snapshot.exists()) {
            const data = snapshot.val();
            setDates(Object.keys(data));
          } else {
            setError("No penalties found.");
          }
  
          //Fetch wallet balance
          const walletRef = ref(database, `users/${userId}/walletBalance`);
          const walletSnapshot = await get(walletRef);
          if (walletSnapshot.exists()) {
            setWalletBalance(walletSnapshot.val());
          }
        } catch (err) {
          console.error("Error fetching penalties or wallet:", err);
          setError("Failed to fetch penalties or wallet.");
        } finally {
          setLoading(false);
        }
      }
    };
  
    fetchDates();
  }, [userId]);
  

const handleDateChange = async (event) => {
    const date = event.target.value;
    setSelectedDate(date);
    setPenaltyDetails([]);
    setSelectedPenalties([]);
    setShowCheckboxes(false);
    setPaidPenalties([]);
  
    try {
      const snapshot = await get(ref(database, `penalties/${userId}/${date}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allDetails = Object.entries(data).map(([time, values]) => ({
          time,
          ...values,
        }));
  
        // Separate paid and unpaid penalties
        const unpaid = allDetails.filter((item) => !item.penalty_paid);
        const paid = allDetails.filter((item) => item.penalty_paid);
  
        setPenaltyDetails(unpaid);
        setPaidPenalties(paid);
      }
    } catch (err) {
      console.error("Error fetching date details:", err);
    }
  };
  


const toggleCheckbox = (index) => {
    setSelectedPenalties((prev) => {
      let updated;
      if (prev.includes(index)) {
        updated = prev.filter((i) => i !== index);
      } else {
        updated = [...prev, index];
      }
  
      // Calculate total based on updated selected indexes
      const total = updated.reduce(
        (sum, i) => sum + (penaltyDetails[i]?.penalty_charge || 0),
        0
      );
      setTotalSelectedAmount(total);
  
      return updated;
    });
  };
  

const handlePayPenaltiesClick = () => {
    setShowCheckboxes(true);
    setSelectedPenalties([]);
    setTotalSelectedAmount(0);
  };
  
const handleProceedToPay = async () => {
    if (totalSelectedAmount > walletBalance) {
      alert("Insufficient wallet balance to proceed with the payment.");
      return;
    }
  
    const updates = [...penaltyDetails]; // local copy to update paid penalties
    const paidItems = [];
  
    try {
      // Mark each selected penalty as paid in Firebase
      for (const index of selectedPenalties) {
        const item = penaltyDetails[index];
        const penaltyRef = ref(database, `penalties/${userId}/${selectedDate}/${item.time}`);
  
        await set(penaltyRef, {
          ...item,
          penalty_paid: true,
        });
  
        // Mark it as paid locally
        updates[index].penalty_paid = true;
        paidItems.push({ ...updates[index] });
      }
  
      // 💰 Deduct the totalSelectedAmount from walletBalance
      const newBalance = walletBalance - totalSelectedAmount;
      const walletRef = ref(database, `users/${userId}/walletBalance`);
      await set(walletRef, newBalance);
  
      // 🔄 Update local state
      setWalletBalance(newBalance);
      const remainingUnpaid = updates.filter((item) => !item.penalty_paid);
      setPenaltyDetails(remainingUnpaid);
      setPaidPenalties((prev) => [...prev, ...paidItems]);
      setSelectedPenalties([]);
      setShowCheckboxes(false);
      setTotalSelectedAmount(0);
  
      alert("Payment successful! Wallet balance updated.");
    } catch (err) {
      console.error("Error during payment:", err);
      alert("An error occurred while processing the payment. Please try again.");
    }
  };
  
  
  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        pt: { xs: 10, sm: 12 },
        px: 2,
        textAlign: "center"
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Penalty Records
      </Typography>
  
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Typography color="error" mt={3}>
          {error}
        </Typography>
      ) : (
        <>
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id="date-select-label">Select Date</InputLabel>
            <Select
              labelId="date-select-label"
              value={selectedDate}
              label="Select Date"
              onChange={handleDateChange}
              size="medium"
            >
              {dates.map((date, index) => (
                <MenuItem key={index} value={date}>
                  {date}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
  
          {penaltyDetails.length > 0 && (
            <>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
            <Button
                variant="contained"
                color="primary"
                onClick={handlePayPenaltiesClick}
            >
                Pay Penalties
            </Button>
            <Typography variant="subtitle1" sx={{ ml: 2 }}>
                💰 Wallet Balance: ₹{walletBalance}
            </Typography>
            </Box>

              <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      {showCheckboxes && (
                        <TableCell>
                          <strong>Select</strong>
                        </TableCell>
                      )}
                      <TableCell>
                        <strong>Time</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Speed (km/h)</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Latitude</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Longitude</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Penalty</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Email Sent</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Penalty Paid</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Vehicle ID</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {penaltyDetails.map((item, index) => (
                      <TableRow key={index}>
                        {showCheckboxes && (
                          <TableCell>
                            <Checkbox
                            checked={selectedPenalties.includes(index)}
                            onChange={() => toggleCheckbox(index)}
                            />
                          </TableCell>
                        )}
                        <TableCell>{item.time}</TableCell>
                        <TableCell>{item.speed}</TableCell>
                        <TableCell>{item.lat}</TableCell>
                        <TableCell>{item.lon}</TableCell>
                        <TableCell>₹{item.penalty_charge}</TableCell>
                        <TableCell>{item.email_sent ? "Yes" : "No"}</TableCell>
                        <TableCell>{item.penalty_paid ? "Yes" : "No"}</TableCell>
                        <TableCell>{item.vehicle_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
  
              {showCheckboxes && selectedPenalties.length > 0 && (
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Total Amount to Pay: ₹{totalSelectedAmount}
                </Typography>
              )}
  
              {showCheckboxes && (
                <Button
                  variant="contained"
                  color="success"
                  sx={{ mt: 3 }}
                  onClick={handleProceedToPay}
                  disabled={selectedPenalties.length === 0}
                >
                  Proceed to Pay
                </Button>
              )}
            </>
          )}
  
          {paidPenalties.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 5 }}>
                Paid Penalties
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#e0ffe0" }}>
                    <TableRow>
                      <TableCell>
                        <strong>Time</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Speed (km/h)</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Latitude</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Longitude</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Penalty</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Email Sent</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Penalty Paid</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Vehicle ID</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paidPenalties.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.time}</TableCell>
                        <TableCell>{item.speed}</TableCell>
                        <TableCell>{item.lat}</TableCell>
                        <TableCell>{item.lon}</TableCell>
                        <TableCell>₹{item.penalty_charge}</TableCell>
                        <TableCell>{item.email_sent ? "Yes" : "No"}</TableCell>
                        <TableCell>Yes</TableCell>
                        <TableCell>{item.vehicle_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </Box>
  );  
};

export default PenaltyTable;




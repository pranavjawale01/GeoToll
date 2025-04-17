import React, { useEffect, useState } from "react";
import { get, ref, set, update } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert } from "@mui/material";

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
  Checkbox,
  Stack
} from "@mui/material";

const PenaltyTable = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [penaltyDetails, setPenaltyDetails] = useState([]);
  const [selectedPenalties, setSelectedPenalties] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalSelectedAmount, setTotalSelectedAmount] = useState(0);
  const [paidPenalties, setPaidPenalties] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const { userId } = useAuth();
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchDates = async () => {
      if (userId) {
        try {
          const penaltyRef = ref(database, `penalties/${userId}`);
          const snapshot = await get(penaltyRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            const sortedDates = Object.keys(data).sort((a, b) => {
              const [dayA, monthA, yearA] = a.split("-").map(Number);
              const [dayB, monthB, yearB] = b.split("-").map(Number);
              const dateA = new Date(yearA, monthA - 1, dayA);
              const dateB = new Date(yearB, monthB - 1, dayB);
              return dateA - dateB;
            });
            setDates(sortedDates);
          } else {
            setError("No penalties found.");
          }

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

        const unpaid = allDetails.filter((item) => !item.penaltyPaid);
        const paid = allDetails.filter((item) => item.penaltyPaid);

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

      const total = updated.reduce(
        (sum, i) => sum + (penaltyDetails[i]?.penaltyCharge || 0),
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
    const newBalance = walletBalance - totalSelectedAmount;

    if (newBalance < 500) {
      alert("Insufficient balance! You need at least ₹500 in your wallet after the payment.");
      return;
    }

    if (totalSelectedAmount > walletBalance) {
      alert("Insufficient wallet balance to proceed with the payment.");
      return;
    }

    const updates = [...penaltyDetails];
    const paidItems = [];
    let timeStamp;
    let vehicleId;

    try {
      for (const index of selectedPenalties) {
        const item = penaltyDetails[index];
        const penaltyRef = ref(database, `penalties/${userId}/${selectedDate}/${item.time}`);

        await set(penaltyRef, {
          ...item,
          penaltyPaid: true,
        });

        updates[index].penaltyPaid = true;
        timeStamp = penaltyRef.timeStamp;
        vehicleId = penaltyRef.vehicleId;
        paidItems.push({ ...updates[index] });
      }

      const walletRef = ref(database, `users/${userId}/walletBalance`);
      await set(walletRef, newBalance);

      setWalletBalance(newBalance);








      
    const today = new Date().toLocaleDateString("en-GB").split("/").join("-");
    const transactionRef = ref(database, `TransactionLogs/${userId}/${today}`);
    const transSnapshot = await get(transactionRef);
    const existingLogs = transSnapshot.exists() ? transSnapshot.val() : {};
    const transactionId = Object.keys(existingLogs).length + 1;

    const firstPenaltyTime = selectedPenalties[0];
    const firstPenaltyData = penaltyDetails[firstPenaltyTime] || {};

    const newTransaction = {
      [transactionId]: {
        Amount: totalSelectedAmount,
        Type: "penalty",
        timeStamp: firstPenaltyData.timeStamp || "",
        vehicleId: firstPenaltyData.vehicleId || "",
        date: selectedDate
      }
    };

    await update(transactionRef, newTransaction);

    alert("Penalty Paid Successfully!");












      const remainingUnpaid = updates.filter((item) => !item.penaltyPaid);
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

  const handleAddFunds = () => {
    navigate("/profile");
  };

  const isPaymentDisabled =
    selectedPenalties.length === 0 ||
    totalSelectedAmount === 0 ||
    totalSelectedAmount > walletBalance - 500;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", pt: 10, px: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
        Penalty Records
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      ) : (
        <>
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="date-select-label">Select Date</InputLabel>
              <Select
                labelId="date-select-label"
                value={selectedDate}
                label="Select Date"
                onChange={handleDateChange}
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
                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
                  <Button variant="contained" color="primary" onClick={handlePayPenaltiesClick}>
                    Pay Penalties
                  </Button>
                  <Typography>
                    💰 <strong>Wallet Balance:</strong> ₹{walletBalance}
                  </Typography>
                </Stack>

                <TableContainer component={Paper} sx={{ mt: 3 }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        {showCheckboxes && <TableCell><strong>Select</strong></TableCell>}
                        <TableCell><strong>Time</strong></TableCell>
                        <TableCell><strong>Speed</strong></TableCell>
                        <TableCell><strong>Latitude</strong></TableCell>
                        <TableCell><strong>Longitude</strong></TableCell>
                        <TableCell><strong>Penalty</strong></TableCell>
                        <TableCell><strong>Email Sent</strong></TableCell>
                        <TableCell><strong>Paid</strong></TableCell>
                        <TableCell><strong>Vehicle ID</strong></TableCell>
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
                          <TableCell>{item.latitude}</TableCell>
                          <TableCell>{item.longitude}</TableCell>
                          <TableCell>₹{item.penaltyCharge}</TableCell>
                          <TableCell>{item.email_sent ? "Yes" : "No"}</TableCell>
                          <TableCell>{item.penaltyPaid ? "Yes" : "No"}</TableCell>
                          <TableCell>{item.vehicleId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {showCheckboxes && selectedPenalties.length > 0 && (
                  <Typography variant="h6" mt={2}>
                    Total Amount to Pay: ₹{totalSelectedAmount}
                  </Typography>
                )}

                {showCheckboxes && totalSelectedAmount > walletBalance - 500 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Wallet must retain a minimum balance of ₹500 after payment. Please add funds.
                  </Alert>
                )}

                {showCheckboxes && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" mt={3}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleProceedToPay}
                      disabled={isPaymentDisabled}
                    >
                      Proceed to Pay
                    </Button>
                    {selectedPenalties.length > 0 &&
                      totalSelectedAmount > 0 &&
                      walletBalance - totalSelectedAmount < 500 && (
                        <Button variant="outlined" color="primary" onClick={handleAddFunds}>
                          Add Funds
                        </Button>
                      )}
                  </Stack>
                )}
              </>
            )}
          </Paper>

          {paidPenalties.length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mt: 5 }}>
              <Typography variant="h6" gutterBottom>
                Paid Penalties
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: "#e0ffe0" }}>
                    <TableRow>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>Speed</strong></TableCell>
                      <TableCell><strong>Latitude</strong></TableCell>
                      <TableCell><strong>Longitude</strong></TableCell>
                      <TableCell><strong>Penalty</strong></TableCell>
                      <TableCell><strong>Email Sent</strong></TableCell>
                      <TableCell><strong>Paid</strong></TableCell>
                      <TableCell><strong>Vehicle ID</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paidPenalties.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.time}</TableCell>
                        <TableCell>{item.speed}</TableCell>
                        <TableCell>{item.latitude}</TableCell>
                        <TableCell>{item.longitude}</TableCell>
                        <TableCell>₹{item.penaltyCharge}</TableCell>
                        <TableCell>{item.email_sent ? "Yes" : "No"}</TableCell>
                        <TableCell>Yes</TableCell>
                        <TableCell>{item.vehicleId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default PenaltyTable;

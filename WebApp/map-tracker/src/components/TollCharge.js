// import React, { useEffect, useState } from "react";
// import { get, ref, update } from "firebase/database";
// import { database } from "../firebase";
// import { useAuth } from "../context/AuthContext";
// import {
//   Box,
//   Typography,
//   CircularProgress,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Button,
//   Alert,
// } from "@mui/material";

// const HighwayDistanceTable = () => {
//   const { userId } = useAuth();

//   const [vehicleNumbers, setVehicleNumbers] = useState([]);
//   const [selectedVehicle, setSelectedVehicle] = useState("");
//   const [dates, setDates] = useState([]);
//   const [selectedDate, setSelectedDate] = useState("");
//   const [distance, setDistance] = useState(null);
//   const [price, setPrice] = useState(null);
//   const [walletBalance, setWalletBalance] = useState(null);
//   const [paymentStatus, setPaymentStatus] = useState(""); // Success | Error
//   const [loading, setLoading] = useState(false);
//   const [paidRecords, setPaidRecords] = useState([]);//10-04-25

//   // Fetch vehicle numbers
//   useEffect(() => {
//     if (!userId) return;

//     const fetchVehicles = async () => {
//       setLoading(true);
//       try {
//         const vehiclesRef = ref(database, `location/${userId}/coordinates`);
//         const snapshot = await get(vehiclesRef);
//         if (snapshot.exists()) {
//           const data = snapshot.val();
//           const vehicles = Object.keys(data).filter((key) => key !== "0");
//           setVehicleNumbers(vehicles);
//         } else {
//           setVehicleNumbers([]);
//         }
//       } catch (err) {
//         console.error("Error fetching vehicle numbers:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVehicles();
//   }, [userId]);


// useEffect(() => {
//     if (!selectedVehicle) return;
  
//     const fetchDates = async () => {
//       setLoading(true);
//       try {
//         const datesRef = ref(database, `location/${userId}/coordinates/${selectedVehicle}`);
//         const snapshot = await get(datesRef);
//         if (snapshot.exists()) {
//           const allDates = snapshot.val();
  
//           const filteredDates = [];
//           const paid = [];
  
//         Object.keys(allDates).forEach((date) => {
//             const entry = allDates[date];
//             if (entry.tollPayed) {
//               const paidDistance = entry.paidDistance ?? "0.00";
//               const paidAmount = entry.paidAmount ?? "0.00";
//               paid.push({ date, distance: paidDistance, price: paidAmount });
//             } else {
//               filteredDates.push(date);
//             }
//           });
          
  
//           setDates(filteredDates);
//           setPaidRecords(paid);
//         } else {
//           setDates([]);
//           setPaidRecords([]);
//         }
//       } catch (err) {
//         console.error("Error fetching dates:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     fetchDates();
//   }, [selectedVehicle, userId]);
  

//   // Fetch highway distance and wallet balance
//   useEffect(() => {
//     if (!selectedVehicle || !selectedDate) return;

//     const fetchDistanceAndBalance = async () => {
//       setLoading(true);
//       try {
//         // Fetch Distance
//         const distRef = ref(
//           database,
//           `location/${userId}/coordinates/${selectedVehicle}/${selectedDate}/todayTotalHighwayDistance`
//         );
//         const snapshot = await get(distRef);
//         if (snapshot.exists()) {
//           const meters = snapshot.val();
//           const kilometers = (meters / 1000).toFixed(2);
//           const calculatedPrice = (kilometers * 1).toFixed(2); // ₹1 per km
//           setDistance(kilometers);
//           setPrice(calculatedPrice);
//         } else {
//           setDistance("Not available");
//           setPrice("N/A");
//         }

//         // Fetch Wallet Balance
//         const walletRef = ref(database, `users/${userId}/walletBalance`);
//         const walletSnap = await get(walletRef);
//         if (walletSnap.exists()) {
//           setWalletBalance(walletSnap.val());
//         } else {
//           setWalletBalance(0);
//         }
//       } catch (err) {
//         console.error("Error fetching data:", err);
//         setDistance("Error");
//         setPrice("Error");
//         setWalletBalance("Error");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDistanceAndBalance();
//   }, [selectedVehicle, selectedDate, userId]);


// const handlePayToll = async () => {
//     if (walletBalance < price) {
//       setPaymentStatus("Insufficient balance");
//       return;
//     }
  
//     try {
//       const newBalance = walletBalance - price;
  
//       // Update wallet balance
//       const walletRef = ref(database, `users/${userId}`);
//       await update(walletRef, { walletBalance: newBalance });
  
//       // Save the paidDistance and paidAmount before resetting
//       const distanceRef = ref(
//         database,
//         `location/${userId}/coordinates/${selectedVehicle}/${selectedDate}`
//       );
//       await update(distanceRef, {
//         paidDistance: distance,
//         paidAmount: price,
//         todayTotalHighwayDistance: 0,
//         tollPayed: true,
//       });
  
//       setWalletBalance(newBalance);
//       setDistance("0.00");
//       setPrice("0.00");
//       setPaymentStatus("Payment successful");
  
//       // Re-fetch updated date records and paid history
//       const updatedSnapshot = await get(
//         ref(database, `location/${userId}/coordinates/${selectedVehicle}`)
//       );
//       if (updatedSnapshot.exists()) {
//         const allDates = updatedSnapshot.val();
//         const filteredDates = [];
//         const paid = [];
  
//         Object.keys(allDates).forEach((date) => {
//             const entry = allDates[date];
//             if (entry.tollPayed) {
//               paid.push({
//                 date,
//                 distance: entry.paidDistance ?? "0.00",
//                 price: entry.paidAmount ?? "0.00",
//               });
//             } else {
//               filteredDates.push(date);
//             }
//           });
          
  
//         setDates(filteredDates);
//         setPaidRecords(paid);
//       }
  
//       // Clear selected date (optional)
//       setSelectedDate("");
//     } catch (err) {
//       console.error("Payment failed:", err);
//       setPaymentStatus("Payment failed");
//     }
//   };  
  
  

//   return (
//     <Box sx={{ maxWidth: 700, mx: "auto", pt: 10, px: 2, textAlign: "center" }}>
//       <Typography variant="h5" fontWeight="bold" gutterBottom>
//         Highway Distance Records
//       </Typography>

//       {loading ? (
//         <Box display="flex" justifyContent="center" mt={4}>
//           <CircularProgress size={40} />
//         </Box>
//       ) : (
//         <>
//           <FormControl fullWidth sx={{ mt: 3 }}>
//             <InputLabel>Select Vehicle</InputLabel>
//             <Select
//               value={selectedVehicle}
//               label="Select Vehicle"
//               onChange={(e) => {
//                 setSelectedVehicle(e.target.value);
//                 setSelectedDate("");
//                 setDistance(null);
//                 setPrice(null);
//                 setWalletBalance(null);
//                 setPaymentStatus("");
//               }}
//             >
//               {vehicleNumbers.map((veh, idx) => (
//                 <MenuItem key={idx} value={veh}>
//                   {veh}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           {selectedVehicle && (
//             <FormControl fullWidth sx={{ mt: 3 }}>
//               <InputLabel>Select Date</InputLabel>
//               <Select
//                 value={selectedDate}
//                 label="Select Date"
//                 onChange={(e) => {
//                   setSelectedDate(e.target.value);
//                   setPaymentStatus("");
//                 }}
//               >
//                 {dates.map((date, idx) => (
//                   <MenuItem key={idx} value={date}>
//                     {date}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           )}

//           {distance !== null && (
//             <>
//               <Box sx={{ mt: 4 }}>
//                 <Typography variant="subtitle1">
//                   <strong>💰 Wallet Balance:</strong> ₹{Number(walletBalance).toFixed(2)}
//                 </Typography>
//               </Box>

//               <TableContainer component={Paper} sx={{ mt: 2 }}>
//                 <Table>
//                   <TableHead sx={{ backgroundColor: "#e3f2fd" }}>
//                     <TableRow>
//                       <TableCell><strong>Vehicle Number</strong></TableCell>
//                       <TableCell><strong>Date</strong></TableCell>
//                       <TableCell><strong>Highway Distance (km)</strong></TableCell>
//                       <TableCell><strong>Payable Price (₹)</strong></TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     <TableRow>
//                       <TableCell>{selectedVehicle}</TableCell>
//                       <TableCell>{selectedDate}</TableCell>
//                       <TableCell>{distance}</TableCell>
//                       <TableCell>{price}</TableCell>
//                     </TableRow>
//                   </TableBody>
//                 </Table>
//               </TableContainer>

//               <Box sx={{ mt: 3 }}>
//                 <Button
//                   variant="contained"
//                   color="primary"
//                   onClick={handlePayToll}
//                   disabled={
//                     walletBalance < price ||
//                     price === "N/A" ||
//                     price === "Error" ||
//                     distance === "0.00"
//                   }
//                 >
//                   Pay Toll
//                 </Button>

//                 {paymentStatus && (
//                   <Box sx={{ mt: 2 }}>
//                     <Alert severity={
//                       paymentStatus === "Payment successful"
//                         ? "success"
//                         : paymentStatus === "Insufficient balance"
//                         ? "warning"
//                         : "error"
//                     }>
//                       {paymentStatus}
//                     </Alert>
//                   </Box>
//                 )}
//               </Box>
//             </>
//           )}

//           {/* To show immediately after vehicle is selected */}
//           {selectedVehicle && paidRecords.length > 0 && (
//             <Box sx={{ mt: 6 }}>
//               <Typography variant="h6" gutterBottom>
//                 Toll Payment History
//               </Typography>
//               <TableContainer component={Paper}>
//                 <Table>
//                   <TableHead sx={{ backgroundColor: "#e8f5e9" }}>
//                     <TableRow>
//                       <TableCell><strong>Date</strong></TableCell>
//                       <TableCell><strong>Distance (km)</strong></TableCell>
//                       <TableCell><strong>Amount Paid (₹)</strong></TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {paidRecords.map((entry, idx) => (
//                       <TableRow key={idx}>
//                         <TableCell>{entry.date}</TableCell>
//                         <TableCell>{entry.distance}</TableCell>
//                         <TableCell>{entry.price}</TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             </Box>
//           )}
//         </>
//       )}
//     </Box>
//   );
// };

// export default HighwayDistanceTable;




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

        setUnpaidRecords(unpaid);
        setPaidRecords(paid);
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
  }, 0).toFixed(2);

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
                    <strong>Total Amount:</strong> ₹{totalAmount}
                  </Typography>
  
                  {walletBalance < totalAmount && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Insufficient wallet balance. Please add funds to proceed.
                    </Alert>
                  )}
  
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ mt: 2 }}
                    onClick={handleProceedToPay}
                    disabled={
                      selectedDates.length === 0 ||
                      totalAmount <= 0 ||
                      walletBalance < totalAmount
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

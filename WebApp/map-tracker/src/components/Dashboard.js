import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { Player } from "@lottiefiles/react-lottie-player";
import gpsAnimation from "./Animations/Animation - 1745670804478.json";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import UserLocation from "./UserLocation";
import UserMap from "./UserMap";
import TodayDistanceInfo from "./TodayDistanceInfo";
import TotalDistanceInfo from "./TotalDistanceInfo";

const Dashboard = () => {
  const [locations, setLocations] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isDateManuallySelected, setIsDateManuallySelected] = useState(false);
  const [todayTotalCost, setTodayTotalCost] = useState(0); // State to hold today's total toll cost
  const [vehicles, setVehicles] = useState([]); // Fetch vehicle numbers
  const [selectedVehicle, setSelectedVehicle] = useState(""); // New dropdown state
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    //console.log("User ID:", userId);  //Log user ID
    if (!userId) {
      navigate("/"); // Navigate to login if user is not authenticated
    }
  }, [userId, navigate]);

  // Fetch user's vehicles from Firebase
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!userId) return;

      const userRef = ref(database, `users/${userId}/vehicles`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const vehicleData = snapshot.val();
          const vehicleList = Object.values(vehicleData); // Convert object to array
          setVehicles(vehicleList); // Store fetched vehicles
        } else {
          console.log("No vehicles found");
          setVehicles([]);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    fetchVehicles();
  }, [userId]);

  // Handle vehicle selection and fetch dates based on vehicle
  const handleVehicleChange = async (e) => {
    const vehicleNumber = e.target.value.trim(); // Trim any spaces
    //console.log("Selected Vehicle:", vehicleNumber);
    setSelectedVehicle(vehicleNumber);
    setSelectedDate(""); // Reset selected date when vehicle changes

    if (!vehicleNumber) {
      setAvailableDates([]);
      return;
    }

    try {
      // console.log(
      //   `Fetching data from path: location/${userId}/coordinates/${vehicleNumber}`
      // );
      const vehicleRef = ref(
        database,
        `location/${userId}/coordinates/${vehicleNumber}`
      );
      const snapshot = await get(vehicleRef);
      if (snapshot.exists()) {
        const data = snapshot.val();

        // Extract only valid date keys (dd-mm-yyyy format)
        const dateRegex = /^\d{2}-\d{2}-\d{4}$/; // Regex to match dd-mm-yyyy
        const dates = Object.keys(data).filter((key) => dateRegex.test(key));
        // Sort dates in dd-mm-yyyy format
        const sortedDates = dates.sort((a, b) => {
          const [dayA, monthA, yearA] = a.split("-").map(Number);
          const [dayB, monthB, yearB] = b.split("-").map(Number);
          return (
            new Date(yearA, monthA - 1, dayA) -
            new Date(yearB, monthB - 1, dayB)
          );
        });
        setAvailableDates(sortedDates);
      } else {
        setAvailableDates([]);
      }
    } catch (error) {
      console.error("Error fetching dates:", error);
    }
  };

  // Set default selected date only when the component first loads or when availableDates are updated for the first time
  useEffect(() => {
    if (availableDates.length > 0 && !isDateManuallySelected) {
      setSelectedDate(availableDates[availableDates.length - 1]); // Default to the latest date
    }
  }, [availableDates, isDateManuallySelected]);

  // Handle date selection by user
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setIsDateManuallySelected(true); // Mark as manually selected
  };

  const handleDateClick = () => {
    if (!selectedVehicle) {
      alert("Please select a vehicle first!");
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: "linear-gradient(to right, #e0f7fa, #e3f2fd)",
        minHeight: "100vh",
        py: 5,
        px: { xs: 2, md: 6 },
      }}
    >
      <Typography
        variant="h4"
        textAlign="center"
        // fontWeight="bold"
        color="primary.main"
        mt={4} // Add top margin here
        sx={{
          textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        Your Dashboard
      </Typography>

      {userId ? (
        <>
          {/* Vehicle & Date Selection Section */}
          <Box
            sx={{
              mx: "auto",
              maxWidth: "1000px",
              p: 4,
              bgcolor: "white",
              borderRadius: 4,
              boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
              mb: 1,
              transition: "0.3s",
              "&:hover": {
                transform: "scale(1.01)",
                boxShadow: "0px 12px 24px rgba(0,0,0,0.15)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {/* Vehicle Dropdown */}
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Select Vehicle</InputLabel>
                <Select
                  value={selectedVehicle}
                  onChange={handleVehicleChange}
                  label="Select Vehicle"
                >
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle, index) => (
                      <MenuItem key={index} value={vehicle.number}>
                        {vehicle.number}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No vehicles available</MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Date Dropdown */}
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Select Date</InputLabel>
                <Select
                  value={selectedDate}
                  onChange={handleDateChange}
                  onClick={handleDateClick}
                  label="Select Date"
                >
                  {availableDates.length > 0 ? (
                    availableDates.map((date) => (
                      <MenuItem key={date} value={date}>
                        {date}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No dates available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Main Content Area */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mx: "auto",
              maxWidth: "1400px",
            }}
          >
            {/* Left Side: Location + Map */}
            <Box sx={{ flex: 2 }}>
              <UserLocation
                userId={userId}
                selectedVehicle={selectedVehicle}
                selectedDate={selectedDate}
                onLocationsUpdate={setLocations}
              />

              <Box
                sx={{
                  ml: 4, // <-- ADD THIS for left spacing
                  height: { xs: "400px", md: "470px" },
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
                  transition: "0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "scale(1.01)",
                    boxShadow: "0px 12px 24px rgba(0,0,0,0.15)",
                  },
                }}
              >
                {selectedVehicle && selectedDate && locations.length > 0 ? (
                  <UserMap locations={locations} userId={userId} />
                ) : (
                  <>
                    <Player
                      autoplay
                      loop
                      src={gpsAnimation}
                      style={{ height: "200px", width: "200px" }}
                    />
                    <Typography
                      variant="h6"
                      color="textSecondary"
                      mt={2}
                      textAlign="center"
                    >
                      Please select a vehicle and date to view your GPS
                      location.
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            {/* Right Side: Cards */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
            >
              {/* Today Distance */}
              <Box
                sx={{
                  bgcolor: "#f1f8e9",
                  borderRadius: 4,
                  p: 2,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0px 8px 16px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <TodayDistanceInfo
                  userId={userId}
                  selectedVehicle={selectedVehicle}
                  selectedDate={selectedDate}
                  onTollUpdate={setTodayTotalCost}
                />
              </Box>

              {/* Total Distance */}
              <Box
                sx={{
                  bgcolor: "#e8f5e9",
                  borderRadius: 4,
                  p: 2,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0px 8px 16px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <TotalDistanceInfo
                  userId={userId}
                  selectedVehicle={selectedVehicle}
                />
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  bgcolor: "#fce4ec",
                  borderRadius: 4,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0px 8px 16px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <button
                  style={{
                    width: "80%",
                    padding: "12px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderRadius: "30px",
                    background: "linear-gradient(45deg, #42a5f5, #478ed1)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.3s",
                  }}
                  onClick={() => navigate("/toll-history")}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(45deg, #478ed1, #42a5f5)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(45deg, #42a5f5, #478ed1)")
                  }
                >
                  Pay Toll
                </button>

                <button
                  style={{
                    width: "80%",
                    padding: "12px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderRadius: "30px",
                    background: "linear-gradient(45deg, #66bb6a, #43a047)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.3s",
                  }}
                  onClick={() => navigate("/penalties")}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(45deg, #43a047, #66bb6a)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(45deg, #66bb6a, #43a047)")
                  }
                >
                  Pay Penalties
                </button>
              </Box>
            </Box>
          </Box>
        </>
      ) : (
        <Typography variant="h6" textAlign="center" mt={5} color="error">
          Please log in to view your location and map.
        </Typography>
      )}
    </Box>
  );
};

export default Dashboard;

//############  CODE BEFORE PROFILE   #############
// import React, { useState } from 'react';
// import UserLocation from './UserLocation';
// import UserMap from './UserMap';

// const Dashboard = () => {
//   const [locations, setLocations] = useState([]);

//   return (
//     <div>
//       <h1>User Dashboard</h1>
//       <UserLocation onLocationsUpdate={setLocations} />
//       {locations.length > 0 && <UserMap locations={locations} />}
//     </div>
//   );
// };

// export default Dashboard;

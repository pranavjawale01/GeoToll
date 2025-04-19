import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase"; // Ensure Firebase is correctly imported
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
    <Box sx={{ flexGrow: 1, bgcolor: "background.default", p: 3, mt: 6.5 }}>
      <Typography variant="h5" gutterBottom textAlign="center">
        Welcome to the Dashboard
      </Typography>

      {userId ? (
        <>
          <Box
            sx={{
              flexGrow: 1, // Add shadow
              transition: "transform 0.2s, box-shadow 0.2s", // Smooth transition for hover
              mt: 1, // Add margin top to separate the two boxes
              "&:hover": {
                transform: "scale(1.01)", // Slightly scale up on hover
                // Increase shadow on hover
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mx: 6.5,
                width: "96%",
              }}
            >
              {/* Vehicle Selection Dropdown */}
              <FormControl sx={{ width: "48%" }}>
                <InputLabel>Select Vehicle</InputLabel>
                <Select
                  value={selectedVehicle}
                  onChange={handleVehicleChange}
                  label="Select Vehicle"
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
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

              <FormControl sx={{ mx: 6.5, width: "48%" }}>
                <InputLabel>Select Date</InputLabel>
                <Select
                  value={selectedDate}
                  onChange={handleDateChange} // Update the selected date on user selection
                  onClick={handleDateClick}
                  label="Select Date"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 200, // Limit dropdown height to avoid it being too long
                      },
                    },
                  }}
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

          <Box sx={{ display: "flex" }}>
            {/* Left container for the map */}
            <Box sx={{ flex: 1, mr: 2 }}>
              {/* Add margin to separate the two columns */}
              <UserLocation
                userId={userId}
                selectedVehicle={selectedVehicle}
                selectedDate={selectedDate}
                onLocationsUpdate={setLocations}
              />

              {locations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      ml: 7,
                      width: "90%",
                      height: "470px",
                      borderRadius: 2,
                      overflow: "hidden",
                      transition: "transform 0.2s, box-shadow 0.2s", // Smooth transition for hover
                      mt: 1, // Add margin top to separate the two boxes
                      "&:hover": {
                        transform: "scale(1.02)", // Slightly scale up on hover
                        boxShadow: 4, // Increase shadow on hover
                      },
                    }}
                  >
                    <UserMap locations={locations} userId={userId} />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Right container for distance info */}
            <Box sx={{ mr: 1, mt: 2 }}>
              <Box
                sx={{
                  backgroundColor: "#e3f2fd",
                  borderRadius: 2,
                  paddingX: 1, // Horizontal padding
                  paddingY: 0.5, // Reduced vertical padding
                  border: "1px solid #ccc", // Set boundary
                  boxShadow: 2, // Add shadow
                  transition: "transform 0.2s, box-shadow 0.2s", // Smooth transition for hover
                  "&:hover": {
                    transform: "scale(1.01)", // Slightly scale up on hover
                    boxShadow: 4, // Increase shadow on hover
                  },
                  height: 145,
                }}
              >
                <TodayDistanceInfo
                  userId={userId}
                  selectedVehicle={selectedVehicle}
                  selectedDate={selectedDate}
                  onTollUpdate={setTodayTotalCost} // Pass callback
                />
              </Box>

              <Box
                sx={{
                  backgroundColor: "#e3f2fd",
                  borderRadius: 2,
                  paddingX: 1, // Horizontal padding
                  paddingY: 0.5, // Reduced vertical padding
                  border: "1px solid #ccc", // Set boundary
                  boxShadow: 2, // Add shadow
                  transition: "transform 0.2s, box-shadow 0.2s", // Smooth transition for hover
                  mt: 1, // Add margin top to separate the two boxes
                  "&:hover": {
                    transform: "scale(1.01)", // Slightly scale up on hover
                    boxShadow: 4, // Increase shadow on hover
                  },
                  height: 145,
                }}
              >
                <TotalDistanceInfo
                  userId={userId}
                  selectedVehicle={selectedVehicle}
                />
              </Box>

              <Box
                sx={{
                  backgroundColor: "#e3f2fd",
                  borderRadius: 2,
                  paddingX: 1, // Horizontal padding
                  paddingY: 0.5, // Reduced vertical padding
                  border: "1px solid #ccc", // Set boundary
                  boxShadow: 2, // Add shadow
                  transition: "transform 0.2s, box-shadow 0.2s", // Smooth transition for hover
                  mt: 1, // Add margin top to separate the two boxes
                  "&:hover": {
                    transform: "scale(1.01)", // Slightly scale up on hover
                    boxShadow: 4, // Increase shadow on hover
                  },
                  height: 145,
                }}
              >
                <div
                style={{
                  display: "flex",
                  flexDirection: "column", // Stack vertically
                  alignItems: "center", // Center horizontally
                  gap: "10px", // Optional spacing between buttons
                  width: "100%",
                  paddingTop: "20px"  
                }}
              >
                <button
                  className="button-impressive"
                  style={{ width: "200px" }}
                  onClick={() => navigate("/toll-history")}
                >
                  Pay Toll
                </button>
                <button
                  className="button-impressive"
                  style={{ width: "200px" }}
                  onClick={() => navigate("/penalties")}
                >
                  Pay Penalties
                </button>
              </div>

              </Box>
            </Box>
          </Box>
        </>
      ) : (
        <Typography variant="body1" textAlign="center">
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
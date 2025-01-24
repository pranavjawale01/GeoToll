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
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    //console.log("User ID:", userId);  //Log user ID
    if (!userId) {
      navigate("/"); // Navigate to login if user is not authenticated
    }
  }, [userId, navigate]);

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
            <FormControl sx={{ mx: 6.5, width: "96%" }}>
              <InputLabel>Select Date</InputLabel>
              <Select
                value={selectedDate}
                onChange={handleDateChange} // Update the selected date on user selection
                label="Select Date"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 200, // Limit dropdown height to avoid it being too long
                    },
                  },
                }}
              >
                {availableDates.map((date) => (
                  <MenuItem key={date} value={date}>
                    {date}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex" }}>
            {/* Left container for the map */}
            <Box sx={{ flex: 1, mr: 2 }}>
              {/* Add margin to separate the two columns */}
              <UserLocation
                userId={userId}
                selectedDate={selectedDate}
                onLocationsUpdate={setLocations}
                onAvailableDatesUpdate={(dates) => {
                  const sortedDates = dates
                    .map((date) => {
                      // Split the dd/mm/yyyy format
                      const [day, month, year] = date.split("-").map(Number);
                      
                      return {
                        original: date,
                        sortable: new Date(year, month - 1, day), // Convert to Date object
                      };
                    })
                    .sort((a, b) => a.sortable - b.sortable) // Sort by Date object
                    .map((item) => item.original); // Extract the original dd/mm/yyyy format
                  setAvailableDates(sortedDates); // Update state with sorted dates
                }}
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
                    <UserMap locations={locations} />
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
                <TotalDistanceInfo userId={userId} />
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
                <h4 className="blinking">
                  Today's total Toll = Rs.{todayTotalCost.toFixed(2)}
                </h4>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <button
                    className="button-impressive"
                    style={{ width: "200px" }}
                  >
                    Pay
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

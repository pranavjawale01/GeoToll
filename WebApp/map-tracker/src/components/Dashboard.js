import React, { useState, useEffect } from "react";
import { Box, Typography, MenuItem, FormControl, Select, InputLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserLocation from "./UserLocation";
import UserMap from "./UserMap";

const Dashboard = () => {
  const [locations, setLocations] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDateManuallySelected, setIsDateManuallySelected] = useState(false); // New flag to track manual date selection
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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
    <Box sx={{ flexGrow: 1, bgcolor: "background.default", p: 3, mt: 8 }}>
      <Typography variant="h4" gutterBottom textAlign="center">
        Welcome to the Dashboard
      </Typography>

      <Box>
        <Typography variant="h6" gutterBottom textAlign="center">
          Your Location and Map
        </Typography>

        {userId ? (
          <>
            <FormControl sx={{ mb: 2, width: '100%' }}>
              <InputLabel>Select Date</InputLabel>
              <Select
                value={selectedDate}
                onChange={handleDateChange} // Update the selected date on user selection
                label="Select Date"
              >
                {availableDates.map((date) => (
                  <MenuItem key={date} value={date}>
                    {date}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <UserLocation
              userId={userId}
              selectedDate={selectedDate}
              onLocationsUpdate={setLocations}
              onAvailableDatesUpdate={setAvailableDates}
            />

            {locations.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    height: "500px",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <UserMap locations={locations} />
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body1" textAlign="center">
            Please log in to view your location and map.
          </Typography>
        )}
      </Box>
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

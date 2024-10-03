import React, { useState } from "react";
import { AppBar, Toolbar, Button, Box, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import UserLocation from "./UserLocation";
import UserMap from "./UserMap";

const Dashboard = () => {
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/profile"); // Navigate to the profile form route
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f4f7" }}>
      {/* Navbar */}
      <AppBar
        position="sticky"
        sx={{ backgroundColor: "#1976d2", position: "relative" }}
      >
        <Toolbar>
          {/* Left: Icon */}
          <Box
            component="img"
            src={"icon.png"} // Referencing the imported icon
            alt="Project Icon"
            sx={{
              width: 50,
              height: 50,
              position: "absolute",
              top: "10px",
              left: "20px",
              filter: "brightness(1.5)",
              borderRadius: "50%",
              boxShadow: "0 0 15px 5px rgba(255, 255, 255, 0.5)",
              transition: "all 0.3s ease",
              "&:hover": {
                filter: "brightness(1.7)",
                boxShadow: "0 0 20px 10px rgba(255, 255, 255, 0.7)",
              },
            }}
          />

          {/* Right: Profile button */}
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" onClick={handleProfileClick}>
            Profile
          </Button>
        </Toolbar>
      </AppBar>

      {/* Dashboard content */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Welcome to Dashboard
        </Typography>

        <Paper
          elevation={3}
          sx={{ p: 2, borderRadius: 2, backgroundColor: "#fff" }}
        >
          <Typography variant="h6" gutterBottom textAlign="center">
            Your Location and Map
          </Typography>
          <UserLocation onLocationsUpdate={setLocations} />

          {/* Display the map if locations are available */}
          {locations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Paper
                elevation={2}
                sx={{ height: "500px", borderRadius: 2, overflow: "hidden" }}
              >
                <UserMap locations={locations} />
              </Paper>
            </Box>
          )}
        </Paper>
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

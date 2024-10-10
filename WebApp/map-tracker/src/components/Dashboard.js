import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Ensure correct context path
import UserLocation from "./UserLocation";
import UserMap from "./UserMap";

const Dashboard = () => {
  const [locations, setLocations] = useState([]);
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate("/"); // Navigate to login if user is not authenticated
    }
  }, [userId, navigate]);

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
            <UserLocation userId={userId} onLocationsUpdate={setLocations} />

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

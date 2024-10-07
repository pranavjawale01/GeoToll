import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  CssBaseline,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import UserLocation from "./UserLocation";
import UserMap from "./UserMap";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const drawerWidthExpanded = 220; // Expanded width
const drawerWidthCollapsed = 60; // Collapsed width

const Dashboard = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // To toggle drawer
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate();

  // Handle Profile Navigation
  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Drawer items
  const drawerItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      onClick: () => navigate("/dashboard"),
    },
    { text: "Logout", icon: <LogoutIcon /> }, // Add logout option
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px)`,
          ml: `${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px`,
        }}
      >
        <Toolbar>
          {/* Drawer toggle button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            noWrap
            component="img"
            src={"icon.png"}
            alt="Project Icon"
            sx={{
              width: 50,
              height: 50,
              position: "absolute",
              top: "5px",
              bottom: "5px",
              left: "80px",
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

          {/* Profile button on the right */}
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" onClick={handleProfileClick}>
            <AccountCircleIcon sx={{ mr: 1 }} />
            Profile
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={isDrawerOpen}
        sx={{
          width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
            boxSizing: "border-box",
            transition: "width 0.3s", // Smooth transition when collapsing/expanding
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {drawerItems.map((item, index) => (
              <ListItem button key={item.text} onClick={item.onClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                {isDrawerOpen && <ListItemText primary={item.text} />}
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3, mt: 8 }}
      >
        <Typography variant="h4" gutterBottom textAlign="center">
          Welcome to the Dashboard
        </Typography>

        {/* Your existing content */}
        <Box>
          <Typography variant="h6" gutterBottom textAlign="center">
            Your Location and Map
          </Typography>

          {/* Assuming you have the UserLocation and UserMap components */}
          <UserLocation onLocationsUpdate={setLocations} />

          {locations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{ height: "500px", borderRadius: 2, overflow: "hidden" }}
              >
                <UserMap locations={locations} />
              </Box>
            </Box>
          )}
        </Box>
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

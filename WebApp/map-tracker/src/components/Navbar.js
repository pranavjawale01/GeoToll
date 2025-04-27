// Improved Navbar
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  CssBaseline,
  Typography,
  Divider,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AndroidIcon from "@mui/icons-material/Android";

import { getDatabase, ref, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";

const drawerWidthExpanded = 220;
const drawerWidthCollapsed = 70;

const Navbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const database = getDatabase();

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogoutClick = async () => {
    if (userId) {
      try {
        const userRef = ref(database, "users/" + userId);
        await update(userRef, { isLoggedIn: false });
        logout();
        navigate("/");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  };

  const drawerItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      onClick: () => navigate("/dashboard"),
    },
    {
      text: "Penalties",
      icon: <GavelIcon />,
      onClick: () => navigate("/penalties"),
    },
    {
      text: "Toll Charges",
      icon: <AttachMoneyIcon />,
      onClick: () => navigate("/toll-history"),
    },
    {
      text: "Logout",
      icon: <LogoutIcon />,
      onClick: handleLogoutClick,
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px)`,
          ml: `${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px`,
          backgroundColor: "#1565c0",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}
      >
        <Toolbar
          sx={{ display: "flex", alignItems: "center", minHeight: "64px" }}
        >
          {/* Logo */}
          <Box
            component="img"
            src="icon.png"
            alt="App Logo"
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              objectFit: "cover",
              mr: 2,
              cursor: "pointer",
              boxShadow: "0 0 10px rgba(255,255,255,0.4)",
              transition: "0.3s",
              "&:hover": {
                boxShadow: "0 0 20px rgba(255,255,255,0.6)",
                transform: "scale(1.05)",
              },
            }}
          />

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Download App Button */}
          <Button
            color="inherit"
            href="https://github.com/pranavjawale01/GeoToll/raw/refs/heads/android/Location%20Tracker%20App.apk"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<AndroidIcon />}
            sx={{ textTransform: "none", fontWeight: "bold" }}
          >
            Download App
          </Button>

          {/* Profile Button */}
          <Button
            color="inherit"
            onClick={handleProfileClick}
            startIcon={<AccountCircleIcon />}
            sx={{ ml: 2, textTransform: "none", fontWeight: "bold" }}
          >
            Profile
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={isDrawerOpen}
        sx={{
          width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
            boxSizing: "border-box",
            transition: "width 0.3s ease",
            overflowX: "hidden",
            backgroundColor: "#1976d2",
            color: "white",
            borderRight: "none",
          },
        }}
      >
        {/* Drawer Header */}
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            minHeight: "64px",
          }}
        >
          {isDrawerOpen && (
            <Typography variant="h6" noWrap sx={{ fontWeight: "bold" }}>
              Menu
            </Typography>
          )}
          <IconButton
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            sx={{ color: "white" }}
          >
            {isDrawerOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

        {/* Drawer Items */}
        <List>
          {drawerItems.map((item) => (
            <Tooltip
              key={item.text}
              title={!isDrawerOpen ? item.text : ""}
              placement="right"
            >
              <ListItem
                button
                onClick={item.onClick}
                sx={{
                  display: "flex",
                  justifyContent: isDrawerOpen ? "flex-start" : "center",
                  alignItems: "center",
                  px: 2,
                  py: 1.5,
                  transition: "background-color 0.3s",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "white",
                    minWidth: 0,
                    mr: isDrawerOpen ? 2 : 0,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {isDrawerOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontWeight: "bold" }}
                  />
                )}
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default Navbar;






// PREVIOUS CODE

// import React, { useState } from "react";
// import {
//   AppBar,
//   Toolbar,
//   Button,
//   Box,
//   Drawer,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   IconButton,
//   CssBaseline,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";
// import DashboardIcon from "@mui/icons-material/Dashboard";
// import LogoutIcon from "@mui/icons-material/Logout";
// import MenuIcon from "@mui/icons-material/Menu";
// import AccountCircleIcon from "@mui/icons-material/AccountCircle";
// import GavelIcon from "@mui/icons-material/Gavel";
// import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
// import AndroidIcon from "@mui/icons-material/Android"; // ✅ Android Icon

// import { getDatabase, ref, update } from "firebase/database";
// import { useAuth } from "../context/AuthContext";

// const drawerWidthExpanded = 220;
// const drawerWidthCollapsed = 60;

// const Navbar = () => {
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const navigate = useNavigate();
//   const { userId, logout } = useAuth();
//   const database = getDatabase();

//   const handleProfileClick = () => {
//     navigate("/profile");
//   };

//   const handleLogoutClick = async () => {
//     if (userId) {
//       try {
//         const userRef = ref(database, "users/" + userId);
//         await update(userRef, { isLoggedIn: false });
//         logout();
//         navigate("/");
//       } catch (error) {
//         console.error("Error logging out:", error);
//       }
//     }
//   };

//   const drawerItems = [
//     {
//       text: "Dashboard",
//       icon: <DashboardIcon />,
//       onClick: () => navigate("/dashboard"),
//     },
//     {
//       text: "Penalties",
//       icon: <GavelIcon />,
//       onClick: () => navigate("/penalties"),
//     },
//     {
//       text: "Toll Charges",
//       icon: <AttachMoneyIcon />,
//       onClick: () => navigate("/toll-history"),
//     },
//     {
//       text: "Logout",
//       icon: <LogoutIcon />,
//       onClick: handleLogoutClick,
//     },
//   ];

//   return (
//     <Box sx={{ display: "flex" }}>
//       <CssBaseline />
//       <AppBar
//         position="fixed"
//         sx={{
//           width: `calc(100% - ${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px)`,
//           ml: `${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px`,
//         }}
//       >
//         <Toolbar>
//           <IconButton
//             color="inherit"
//             aria-label="open drawer"
//             edge="start"
//             onClick={() => setIsDrawerOpen(!isDrawerOpen)}
//             sx={{ mr: 2 }}
//           >
//             <MenuIcon />
//           </IconButton>

//           <Box
//             component="img"
//             src={"icon.png"}
//             alt="Project Icon"
//             sx={{
//               width: 50,
//               height: 50,
//               position: "absolute",
//               top: "5px",
//               bottom: "5px",
//               left: "80px",
//               filter: "brightness(1.5)",
//               borderRadius: "50%",
//               boxShadow: "0 0 15px 5px rgba(255, 255, 255, 0.5)",
//               transition: "all 0.3s ease",
//               "&:hover": {
//                 filter: "brightness(1.7)",
//                 boxShadow: "0 0 20px 10px rgba(255, 255, 255, 0.7)",
//               },
//             }}
//           />

//           <Box sx={{ flexGrow: 1 }} />

//           {/* ✅ Download App Button */}
//           <Button
//             color="inherit"
//             href="https://github.com/pranavjawale01/GeoToll/raw/refs/heads/android/Location%20Tracker%20App.apk"
//             target="_blank"
//             rel="noopener noreferrer"
//             sx={{ mr: 2 }}
//           >
//             <AndroidIcon sx={{ mr: 1 }} />
//             Download App
//           </Button>

//           <Button color="inherit" onClick={handleProfileClick}>
//             <AccountCircleIcon sx={{ mr: 1 }} />
//             Profile
//           </Button>
//         </Toolbar>
//       </AppBar>

//       <Drawer
//         variant="permanent"
//         open={isDrawerOpen}
//         sx={{
//           width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
//           flexShrink: 0,
//           [`& .MuiDrawer-paper`]: {
//             width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
//             boxSizing: "border-box",
//             transition: "width 0.3s",
//           },
//         }}
//       >
//         <Toolbar />
//         <Box sx={{ overflow: "auto" }}>
//           <List>
//             {drawerItems.map((item) => (
//               <ListItem button key={item.text} onClick={item.onClick}>
//                 <ListItemIcon>{item.icon}</ListItemIcon>
//                 {isDrawerOpen && <ListItemText primary={item.text} />}
//               </ListItem>
//             ))}
//           </List>
//         </Box>
//       </Drawer>
//     </Box>
//   );
// };

// export default Navbar;
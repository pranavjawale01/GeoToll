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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AndroidIcon from "@mui/icons-material/Android"; // ✅ Android Icon

import { getDatabase, ref, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";

const drawerWidthExpanded = 220;
const drawerWidthCollapsed = 60;

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
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px)`,
          ml: `${isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed}px`,
        }}
      >
        <Toolbar>
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

          <Box sx={{ flexGrow: 1 }} />

          {/* ✅ Download App Button */}
          <Button
            color="inherit"
            href="https://github.com/pranavjawale01/GeoToll/raw/refs/heads/android/Location%20Tracker%20App.apk"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mr: 2 }}
          >
            <AndroidIcon sx={{ mr: 1 }} />
            Download App
          </Button>

          <Button color="inherit" onClick={handleProfileClick}>
            <AccountCircleIcon sx={{ mr: 1 }} />
            Profile
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={isDrawerOpen}
        sx={{
          width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: isDrawerOpen ? drawerWidthExpanded : drawerWidthCollapsed,
            boxSizing: "border-box",
            transition: "width 0.3s",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {drawerItems.map((item) => (
              <ListItem button key={item.text} onClick={item.onClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                {isDrawerOpen && <ListItemText primary={item.text} />}
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Navbar;

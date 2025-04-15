// src/components/UserDashboard/UserDashboard.js
import React from 'react';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Logout as LogoutIcon, Report as ReportIcon } from '@mui/icons-material';
import './UserDashboard.css';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Box className="dashboard-container">
      <Paper className="dashboard-paper">
        <Box className="dashboard-header">
          <Typography variant="h4" component="h1" className="dashboard-title">
            User Dashboard
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </Button>
        </Box>
        
        <Typography variant="h6" className="welcome-message">
          Welcome, {currentUser?.email}
        </Typography>
        
        <Box className="action-section">
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReportIcon />}
            size="large"
            className="action-button"
          >
            Report New Hit & Run Case
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserDashboard;
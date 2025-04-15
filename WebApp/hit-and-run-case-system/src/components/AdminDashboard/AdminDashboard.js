// src/components/AdminDashboard/AdminDashboard.js
import React from 'react';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText } from '@mui/material';
import { Logout as LogoutIcon, AdminPanelSettings as AdminPanelIcon } from '@mui/icons-material';
import './AdminDashboard.css';

const AdminDashboard = () => {
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

  const cases = [
    { id: 1, location: 'Main Street', date: '2023-05-15', status: 'Open' },
    { id: 2, location: 'Central Park', date: '2023-05-16', status: 'Investigation' },
    { id: 3, location: 'Downtown', date: '2023-05-17', status: 'Closed' },
  ];

  return (
    <Box className="admin-container">
      <Paper className="admin-paper">
        <Box className="admin-header">
          <Typography variant="h4" component="h1" className="admin-title">
            Admin Dashboard
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
        
        <Box className="admin-info">
          <AdminPanelIcon className="admin-icon" />
          <Typography variant="h6" className="admin-email">
            Administrator: {currentUser?.email}
          </Typography>
        </Box>
        
        <Typography variant="h5" className="cases-title">
          Recent Hit & Run Cases
        </Typography>
        
        <List className="cases-list">
          {cases.map((caseItem) => (
            <ListItem key={caseItem.id} className="case-item">
              <ListItemText
                primary={`Case #${caseItem.id} - ${caseItem.location}`}
                secondary={`Date: ${caseItem.date} | Status: ${caseItem.status}`}
                className="case-text"
              />
              <Button variant="outlined" size="small" className="case-button">
                View Details
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
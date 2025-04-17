// src/components/AdminDashboard/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Divider,
  Chip,
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@mui/material';
import { 
  Logout as LogoutIcon, 
  AdminPanelSettings as AdminPanelIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  CalendarToday as DateIcon,
  Schedule as TimeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { ref, get, update } from 'firebase/database';
import { database } from '../../firebase';
import OSMMapPicker from '../UserDashboard/OSMMapPicker';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [pathData, setPathData] = useState([]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  useEffect(() => {
    const fetchPendingCases = async () => {
      try {
        const casesRef = ref(database, 'HitAndRunCaseReport');
        const snapshot = await get(casesRef);
        
        if (snapshot.exists()) {
          const allCases = [];
          snapshot.forEach((userSnapshot) => {
            userSnapshot.forEach((dateSnapshot) => {
              dateSnapshot.forEach((caseSnapshot) => {
                const caseData = caseSnapshot.val();
                if (caseData.status === 'pending') {
                  allCases.push({
                    id: caseSnapshot.key,
                    userId: userSnapshot.key,
                    dateReported: dateSnapshot.key,
                    ...caseData
                  });
                }
              });
            });
          });
          setCases(allCases);
        } else {
          setCases([]);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError('Failed to load cases');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCases();
  }, []);

  const handleViewCase = async (caseItem) => {
    setSelectedCase(caseItem);
    try {
      const pathRef = ref(database, 
        `location/${caseItem.userId}/coordinates/${caseItem.vehicleId}/${caseItem.dateOfAccident}`);
      const snapshot = await get(pathRef);
      
      if (snapshot.exists()) {
        const data = [];
        Object.entries(snapshot.val()).forEach(([time, value]) => {
          if (time === 'today' || time === 'todayTotalDistance' || time === 'todayTotalHighwayDistance') {
            return;
          }
          
          if (value.latitude && value.longitude) {
            data.push({
              time,
              latitude: parseFloat(value.latitude),
              longitude: parseFloat(value.longitude),
              isOnHighway: value.isOnHighway || false
            });
          }
        });
        
        data.sort((a, b) => a.time.localeCompare(b.time));
        setPathData(data);
      }
    } catch (err) {
      console.error('Error fetching path data:', err);
      setError('Failed to load vehicle path data');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCase(null);
    setPathData([]);
  };

  const handleResolveCase = async (status) => {
    try {
      if (!selectedCase) return;
      
      const caseRef = ref(database, 
        `HitAndRunCaseReport/${selectedCase.userId}/${selectedCase.dateReported}/${selectedCase.id}`);
      
      await update(caseRef, { status });
      setCases(cases.filter(c => c.id !== selectedCase.id));
      handleCloseDialog();
    } catch (err) {
      console.error('Error updating case:', err);
      setError('Failed to update case status');
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          pb: 2,
          borderBottom: '1px solid #eee'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AdminPanelIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Admin Dashboard
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ textTransform: 'none', borderRadius: 1 }}
          >
            Logout
          </Button>
        </Box>
        
        {/* User Info */}
        <Card sx={{ mb: 4, backgroundColor: '#fafafa' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              {currentUser?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                {currentUser?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrator
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        {/* Cases Section */}
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium', color: 'text.primary' }}>
            Pending Cases
            <Chip 
              label={`${cases.length} pending`} 
              color="primary" 
              size="small" 
              sx={{ ml: 2, fontWeight: 'bold' }}
            />
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          ) : cases.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center', backgroundColor: '#fafafa' }}>
              <Typography variant="body1" color="text.secondary">
                No pending cases found
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {cases.map((caseItem) => (
                <Grid item xs={12} md={6} lg={4} key={caseItem.id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      '&:hover': { 
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {caseItem.vehicleId?.charAt(0) || 'C'}
                        </Avatar>
                      }
                      title={`Case #${caseItem.id}`}
                      subheader={`Reported: ${new Date(caseItem.dateAndTimeOfReport).toLocaleString()}`}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CarIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {caseItem.vehicleId}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {caseItem.accidentLocation?.latitude?.toFixed(4)}, {caseItem.accidentLocation?.longitude?.toFixed(4)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DateIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {caseItem.dateOfAccident} at {caseItem.timeOfAccident}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <DescriptionIcon color="action" sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                        {caseItem.accidentDescription}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleViewCase(caseItem)}
                        sx={{ textTransform: 'none' }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Case Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: { 
            height: '90vh',
            borderRadius: 2
          } 
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
          py: 2
        }}>
          <Typography variant="h6">
            Case Details - #{selectedCase?.id}
          </Typography>
          <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {selectedCase && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Case Information Section */}
              <Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                      <CarIcon sx={{ mr: 1 }} /> Vehicle Information
                    </Typography>
                    <Box sx={{ pl: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Vehicle ID:</strong> {selectedCase.vehicleId}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Reported by:</strong> User {selectedCase.userId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Reported on:</strong> {new Date(selectedCase.dateAndTimeOfReport).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1 }} /> Accident Details
                    </Typography>
                    <Box sx={{ pl: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Date:</strong> {selectedCase.dateOfAccident}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Time:</strong> {selectedCase.timeOfAccident}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {selectedCase.accidentLocation.latitude.toFixed(6)}, {selectedCase.accidentLocation.longitude.toFixed(6)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1 }} /> Description
                </Typography>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#fafafa', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {selectedCase.accidentDescription}
                  </Typography>
                </Paper>
              </Box>

              {/* Map and Analysis Section */}
              <Box sx={{ display: 'flex', flexGrow: 1, height: 'calc(100% - 250px)' }}>
                {/* Map Section */}
                <Box sx={{ 
                  width: '50%', 
                  p: 2, 
                  borderRight: '1px solid #eee',
                  height: '100%',
                  overflow: 'hidden'
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                    Accident Location
                  </Typography>
                  {pathData.length > 0 && (
                    <Box sx={{ height: '100%', borderRadius: 1, overflow: 'hidden' }}>
                      <OSMMapPicker 
                        initialLocation={{
                          lat: selectedCase.accidentLocation.latitude,
                          lng: selectedCase.accidentLocation.longitude
                        }}
                        pathData={pathData}
                        boundingBox={selectedCase.accidentLocation.boundingBox}
                        readOnly
                      />
                    </Box>
                  )}
                </Box>

                {/* Suspect Analysis Section */}
                <Box sx={{ 
                  width: '50%', 
                  p: 2,
                  height: '100%',
                  overflow: 'auto'
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                    Suspect Analysis
                  </Typography>
                  
                  <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: '#fff8e1' }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Note:</strong> The system analyzes vehicles that were in the vicinity during the accident time window.
                    </Typography>
                  </Paper>
                  
                  {/* Sample Suspect Card - Replace with real data */}
                  <Card sx={{ mb: 2 }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: 'warning.main' }}>S1</Avatar>}
                      title="Vehicle XJ-4587"
                      subheader="Probability: 78%"
                    />
                    <CardContent>
                      <Typography variant="body2">
                        This vehicle was within 200m of the accident location at the time of incident.
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ mb: 2 }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: 'warning.main' }}>S2</Avatar>}
                      title="Vehicle KL-3021"
                      subheader="Probability: 65%"
                    />
                    <CardContent>
                      <Typography variant="body2">
                        Detected speeding in the area around the time of accident.
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={() => handleResolveCase('rejected')} 
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            sx={{ mr: 1 }}
          >
            Reject
          </Button>
          <Button 
            onClick={() => handleResolveCase('approved')} 
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
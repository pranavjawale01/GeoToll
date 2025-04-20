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
  ListItemAvatar,
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
  IconButton,
  Tooltip,
  Badge,
  Checkbox,
  FormControlLabel,
  Collapse
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
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Verified as VerifiedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
  const [suspects, setSuspects] = useState([]);
  const [processingSuspects, setProcessingSuspects] = useState(false);
  const [selectedSuspects, setSelectedSuspects] = useState([]);
  const [showSuspectSelection, setShowSuspectSelection] = useState(false);

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

  const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const isWithinBoundingBox = (point, box) => {
    return (
      point.lat >= box.xmin &&
      point.lat <= box.xmax &&
      point.lng >= box.ymin &&
      point.lng <= box.ymax
    );
  };

  const analyzeSuspects = async (currentCase) => {
    try {
      setProcessingSuspects(true);
      const usersRef = ref(database, 'location');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) {
        return [];
      }

      const suspects = [];
      const accidentTime = new Date(`${currentCase.dateOfAccident} ${currentCase.timeOfAccident}`);
      const accidentLocation = {
        lat: currentCase.accidentLocation.latitude,
        lng: currentCase.accidentLocation.longitude
      };
      const boundingBox = currentCase.accidentLocation.boundingBox;

      // Get all users except the one who reported the case
      const userIds = Object.keys(usersSnapshot.val()).filter(id => id !== currentCase.userId);

      for (const userId of userIds) {
        const userVehiclesRef = ref(database, `location/${userId}/coordinates`);
        const userVehiclesSnapshot = await get(userVehiclesRef);
        
        if (!userVehiclesSnapshot.exists()) continue;

        const vehicleIds = Object.keys(userVehiclesSnapshot.val());
        
        for (const vehicleId of vehicleIds) {
          const vehicleDatesRef = ref(database, `location/${userId}/coordinates/${vehicleId}`);
          const vehicleDatesSnapshot = await get(vehicleDatesRef);
          
          if (!vehicleDatesSnapshot.exists()) continue;

          // First check if the date matches the accident date
          const dates = Object.keys(vehicleDatesSnapshot.val())
            .filter(date => date === currentCase.dateOfAccident);
          
          if (dates.length === 0) continue;

          for (const date of dates) {
            const vehicleTimesRef = ref(database, `location/${userId}/coordinates/${vehicleId}/${date}`);
            const vehicleTimesSnapshot = await get(vehicleTimesRef);
            
            if (!vehicleTimesSnapshot.exists()) continue;

            const times = Object.keys(vehicleTimesSnapshot.val())
              .filter(time => !['today', 'todayTotalDistance', 'todayTotalHighwayDistance'].includes(time));
            
            for (const time of times) {
              const locationData = vehicleTimesSnapshot.val()[time];
              if (!locationData.latitude || !locationData.longitude) continue;

              // Convert to Date objects for comparison
              const pointTime = new Date(`${date} ${time}`);
              const timeDiff = Math.abs(pointTime - accidentTime) / (1000 * 60); // Difference in minutes
              
              // Only consider points within 30 minutes of the accident time
              if (timeDiff > 30) continue;

              const suspectLocation = {
                lat: parseFloat(locationData.latitude),
                lng: parseFloat(locationData.longitude)
              };
              
              // Check if the point is within the bounding box
              if (!isWithinBoundingBox(suspectLocation, boundingBox)) continue;

              const distance = calculateDistance(accidentLocation, suspectLocation);
              
              // Only consider points within 1 km of the accident location
              if (distance > 1) continue;

              suspects.push({
                userId,
                vehicleId,
                time,
                date,
                distance,
                timeDiff,
                location: suspectLocation,
                isOnHighway: locationData.isOnHighway || false,
                timestamp: pointTime.getTime()
              });
            }
          }
        }
      }

      // Calculate probability score for each suspect
      const suspectsWithProbability = suspects.map(suspect => {
        // Ensure valid distance and timeDiff values
        const safeDistance = isNaN(suspect.distance) ? 1 : Math.max(0.001, suspect.distance);
        const safeTimeDiff = isNaN(suspect.timeDiff) ? 30 : Math.max(0.1, suspect.timeDiff);
        
        // Normalize distance (0-1 where 1 is closest)
        const maxDistance = 1; // 1 km
        const distanceScore = Math.max(0, 1 - (safeDistance / maxDistance));
        
        // Normalize time difference (0-1 where 1 is closest in time)
        const maxTimeDiff = 30; // 30 minutes
        const timeScore = Math.max(0, 1 - (safeTimeDiff / maxTimeDiff));
        
        // Combine scores with weights (70% distance, 30% time)
        let probability = Math.round((distanceScore * 0.7 + timeScore * 0.3) * 100);
        
        // Ensure probability is between 0 and 100
        probability = Math.max(0, Math.min(100, probability));
        
        return {
          ...suspect,
          id: `${suspect.userId}-${suspect.vehicleId}`,
          probability,
          displayDistance: suspect.distance,
          displayTimeDiff: suspect.timeDiff
        };
      });

      // Group by vehicle and keep only the highest probability entry for each vehicle
      const vehicleGroups = {};
      suspectsWithProbability.forEach(suspect => {
        const vehicleKey = `${suspect.userId}-${suspect.vehicleId}`;
        if (!vehicleGroups[vehicleKey] || suspect.probability > vehicleGroups[vehicleKey].probability) {
          vehicleGroups[vehicleKey] = suspect;
        }
      });

      // Convert back to array and sort by probability
      const rankedSuspects = Object.values(vehicleGroups)
        .sort((a, b) => b.probability - a.probability || a.timeDiff - b.timeDiff)
        .map((suspect, index) => ({
          ...suspect,
          rank: index + 1
        }));

      return rankedSuspects;
    } catch (error) {
      console.error('Error analyzing suspects:', error);
      return [];
    } finally {
      setProcessingSuspects(false);
    }
  };

  const handleViewCase = async (caseItem) => {
    setSelectedCase(caseItem);
    setSelectedSuspects([]);
    setShowSuspectSelection(false);
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
      
      const suspects = await analyzeSuspects(caseItem);
      setSuspects(suspects);
      
    } catch (err) {
      console.error('Error fetching case data:', err);
      setError('Failed to load case details');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCase(null);
    setPathData([]);
    setSuspects([]);
    setSelectedSuspects([]);
    setShowSuspectSelection(false);
  };

  const handleSuspectSelection = (suspectId) => {
    setSelectedSuspects(prev => 
      prev.includes(suspectId)
        ? prev.filter(id => id !== suspectId)
        : [...prev, suspectId]
    );
  };

  const handleResolveCase = async (status) => {
    try {
      if (!selectedCase) return;
      
      const caseRef = ref(database, 
        `HitAndRunCaseReport/${selectedCase.userId}/${selectedCase.dateReported}/${selectedCase.id}`);
      
      const updateData = { status };
      
      if (status === 'approved' && selectedSuspects.length > 0) {
        updateData.suspects = suspects
          .filter(suspect => selectedSuspects.includes(suspect.id))
          .map(suspect => ({
            userId: suspect.userId,
            vehicleId: suspect.vehicleId,
            time: suspect.time,
            distance: suspect.distance,
            probability: suspect.probability,
            location: suspect.location,
            isOnHighway: suspect.isOnHighway
          }));
      }
      
      await update(caseRef, updateData);
      setCases(cases.filter(c => c.id !== selectedCase.id));
      handleCloseDialog();
    } catch (err) {
      console.error('Error updating case:', err);
      setError('Failed to update case status');
    }
  };

  return (
    <Box className="admin-container">
      <Paper elevation={3} className="admin-paper">
        {/* Header */}
        <Box className="admin-header">
          <Box className="admin-title-container">
            <Badge badgeContent={cases.length} color="primary" overlap="circular">
              <Avatar className="admin-avatar">
                <AdminPanelIcon />
              </Avatar>
            </Badge>
            <Typography variant="h4" component="h1" className="admin-title">
              Case Management Dashboard
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton className="logout-button" onClick={handleLogout}>
              <LogoutIcon color="error" />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* User Info */}
        <Card className="user-info-card">
          <CardContent className="user-info-content">
            <Avatar className="user-avatar">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box className="user-info-text">
              <Typography variant="h6" className="user-email">
                {currentUser?.email}
              </Typography>
              <Typography variant="body2" className="user-role">
                Administrator
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        {/* Cases Section */}
        <Box className="cases-section">
          <Box className="cases-header">
            <Typography variant="h5" className="cases-title">
              <CarIcon className="cases-title-icon" />
              Pending Hit & Run Cases
            </Typography>
            <Chip 
              label={`${cases.length} pending`} 
              color="primary" 
              className="cases-count-chip"
            />
          </Box>
          
          {loading ? (
            <Box className="loading-container">
              <CircularProgress size={60} thickness={4} />
            </Box>
          ) : error ? (
            <Alert severity="error" className="error-alert">
              <Typography fontWeight={600}>{error}</Typography>
            </Alert>
          ) : cases.length === 0 ? (
            <Card className="empty-state-card">
              <Typography variant="body1" className="empty-state-text">
                No pending cases found
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3} className="cases-grid">
              {cases.map((caseItem) => (
                <Grid item xs={12} md={6} lg={4} key={caseItem.id} className="case-grid-item">
                  <Card 
                    className="case-card"
                    onClick={() => handleViewCase(caseItem)}
                  >
                    <CardHeader
                      avatar={
                        <Avatar className="case-avatar">
                          {caseItem.vehicleId?.charAt(0) || 'C'}
                        </Avatar>
                      }
                      title={`Case #${caseItem.id}`}
                      subheader={`Reported: ${new Date(caseItem.dateAndTimeOfReport).toLocaleString()}`}
                      className="case-card-header"
                    />
                    <CardContent className="case-card-content">
                      <Box className="case-info-item">
                        <CarIcon className="case-info-icon" />
                        <Typography variant="body2" className="case-info-text">
                          {caseItem.vehicleId}
                        </Typography>
                      </Box>
                      <Box className="case-info-item">
                        <LocationIcon className="case-info-icon" />
                        <Typography variant="body2" className="case-info-text">
                          {caseItem.accidentLocation?.latitude?.toFixed(4)}, {caseItem.accidentLocation?.longitude?.toFixed(4)}
                        </Typography>
                      </Box>
                      <Box className="case-info-item">
                        <DateIcon className="case-info-icon" />
                        <Typography variant="body2" className="case-info-text">
                          {caseItem.dateOfAccident} at {caseItem.timeOfAccident}
                        </Typography>
                      </Box>
                      <Typography variant="body2" className="case-description">
                        <DescriptionIcon className="case-description-icon" />
                        {caseItem.accidentDescription}
                      </Typography>
                    </CardContent>
                    <Box className="case-card-actions">
                      <Button 
                        variant="outlined" 
                        size="small"
                        className="view-details-button"
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
        maxWidth="lg"
        fullWidth
        className="case-dialog"
      >
        <DialogTitle className="dialog-title">
          <Box className="dialog-title-content">
            <Avatar className="dialog-title-avatar">
              <CarIcon />
            </Avatar>
            <Box className="dialog-title-text">
              <Typography variant="h6" className="dialog-title-main">
                Case Investigation #{selectedCase?.id}
              </Typography>
              <Typography variant="body2" className="dialog-title-sub">
                Vehicle {selectedCase?.vehicleId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseDialog} className="dialog-close-button">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="dialog-content">
          {selectedCase && (
            <Box className="dialog-content-container">
              {/* Case Information Section */}
              <Box className="case-info-section">
                <Grid container spacing={3} className="case-info-grid">
                  <Grid item xs={12} md={6} className="case-info-grid-item">
                    <Typography variant="subtitle1" className="section-title">
                      <CarIcon className="section-title-icon" /> Vehicle Information
                    </Typography>
                    <Box className="section-content">
                      <Typography variant="body2" className="info-item">
                        <strong>Vehicle ID:</strong> {selectedCase.vehicleId}
                      </Typography>
                      <Typography variant="body2" className="info-item">
                        <strong>Reported by:</strong> User {selectedCase.userId}
                      </Typography>
                      <Typography variant="body2" className="info-item">
                        <strong>Reported on:</strong> {new Date(selectedCase.dateAndTimeOfReport).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6} className="case-info-grid-item">
                    <Typography variant="subtitle1" className="section-title">
                      <LocationIcon className="section-title-icon" /> Accident Details
                    </Typography>
                    <Box className="section-content">
                      <Typography variant="body2" className="info-item">
                        <strong>Date:</strong> {selectedCase.dateOfAccident}
                      </Typography>
                      <Typography variant="body2" className="info-item">
                        <strong>Time:</strong> {selectedCase.timeOfAccident}
                      </Typography>
                      <Typography variant="body2" className="info-item">
                        <strong>Location:</strong> {selectedCase.accidentLocation.latitude.toFixed(6)}, {selectedCase.accidentLocation.longitude.toFixed(6)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle1" className="section-title">
                  <DescriptionIcon className="section-title-icon" /> Description
                </Typography>
                <Paper elevation={0} className="description-paper">
                  <Typography variant="body2" className="description-text">
                    {selectedCase.accidentDescription}
                  </Typography>
                </Paper>
              </Box>

              {/* Map and Analysis Section */}
              <Box className="analysis-section">
                {/* Map Section */}
                <Box className="map-section">
                  <Typography variant="subtitle1" className="section-title">
                    <LocationIcon className="section-title-icon" /> Location Analysis
                  </Typography>
                  {pathData.length > 0 && (
                    <Box className="map-container">
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
                <Box className="suspects-section">
                  <Typography variant="subtitle1" className="section-title">
                    <WarningIcon className="section-title-icon" /> Suspect Vehicles
                  </Typography>
                  
                  {processingSuspects ? (
                    <Box className="suspects-loading">
                      <CircularProgress size={24} />
                      <Typography variant="body2" className="loading-text">
                        Analyzing potential suspects...
                      </Typography>
                    </Box>
                  ) : suspects.length === 0 ? (
                    <Alert severity="info" className="no-suspects-alert">
                      No potential suspects found in the vicinity during the incident.
                    </Alert>
                  ) : (
                    <>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setShowSuspectSelection(!showSuspectSelection)}
                        endIcon={showSuspectSelection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        className="toggle-suspect-selection"
                      >
                        {showSuspectSelection ? 'Hide Selection' : 'Select Suspects'}
                      </Button>

                      <Collapse in={showSuspectSelection}>
                        <Box className="suspect-selection-note">
                          <Typography variant="body2" color="text.secondary">
                            Select suspects to include in the case report when approving:
                          </Typography>
                        </Box>
                      </Collapse>

                      <List className="suspects-list">
                        {suspects.map((suspect, index) => (
                          <ListItem 
                            key={suspect.id}
                            className="suspect-item"
                          >
                            <Box className="suspect-checkbox-container">
                              <Checkbox
                                checked={selectedSuspects.includes(suspect.id)}
                                onChange={() => handleSuspectSelection(suspect.id)}
                                color="primary"
                                className="suspect-checkbox"
                              />
                            </Box>
                            <ListItemAvatar>
                              <Avatar className="suspect-avatar">S{index + 1}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`Vehicle ${suspect.vehicleId}`}
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    className="suspect-probability"
                                  >
                                    <strong>{suspect.probability}% match</strong> - {(suspect.distance * 1000).toFixed(0)} meters away
                                  </Typography>
                                  <Box className="suspect-details">
                                    <Typography variant="body2" className="suspect-detail">
                                      <strong>Time:</strong> {suspect.time} ({suspect.timeDiff.toFixed(1)} min {suspect.timeDiff > 0 ? 'after' : 'before'})
                                    </Typography>
                                    <Typography variant="body2" className="suspect-detail">
                                      <strong>Location:</strong> {suspect.location.lat.toFixed(4)}, {suspect.location.lng.toFixed(4)}
                                    </Typography>
                                    {suspect.isOnHighway && (
                                      <Chip 
                                        label="On Highway" 
                                        size="small" 
                                        className="highway-chip"
                                      />
                                    )}
                                  </Box>
                                </React.Fragment>
                              }
                              className="suspect-text"
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button 
            onClick={() => handleResolveCase('rejected')} 
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            className="reject-button"
          >
            Reject Case
          </Button>
          <Button 
            onClick={() => handleResolveCase('approved')} 
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
            className="approve-button"
            disabled={processingSuspects}
          >
            Approve Case
            {selectedSuspects.length > 0 && (
              <span className="selected-suspects-count">
                ({selectedSuspects.length} selected)
              </span>
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
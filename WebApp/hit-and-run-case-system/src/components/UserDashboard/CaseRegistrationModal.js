import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { database } from '../../firebase';
import { ref, push, set, get } from 'firebase/database';
import OSMMapPicker from './OSMMapPicker';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 1000,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 3,
  overflow: 'auto'
};

const generateBoundingBox = (lat, lng, distance = 5) => {
  const earthRadius = 6371; // km
  const latDelta = distance / earthRadius * (180 / Math.PI);
  const lngDelta = distance / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  
  return {
    xmax: lat + latDelta,
    xmin: lat - latDelta,
    ymax: lng + lngDelta,
    ymin: lng - lngDelta
  };
};

const CaseRegistrationModal = ({ open, onClose, userId }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    dateOfAccident: '',
    timeOfAccident: '',
    accidentDescription: '',
    accidentLocation: null
  });
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [mapLocation, setMapLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [formError, setFormError] = useState(null);

  // Fetch vehicles for this user
  useEffect(() => {
    if (!open || !userId) return;
    
    const fetchVehicles = async () => {
      try {
        const vehiclesRef = ref(database, `location/${userId}/coordinates`);
        const snapshot = await get(vehiclesRef);
        if (snapshot.exists()) {
          setVehicles(Object.keys(snapshot.val()));
        } else {
          setVehicles([]);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, [open, userId]);

  // Fetch dates when vehicle is selected
  useEffect(() => {
    if (!formData.vehicleId || !userId) return;
    
    const fetchDates = async () => {
      try {
        const datesRef = ref(database, `location/${userId}/coordinates/${formData.vehicleId}`);
        const snapshot = await get(datesRef);
        if (snapshot.exists()) {
          setAvailableDates(Object.keys(snapshot.val()));
        } else {
          setAvailableDates([]);
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
      }
    };

    fetchDates();
  }, [formData.vehicleId, userId]);

  // Fetch times when date is selected
  useEffect(() => {
    if (!formData.vehicleId || !formData.dateOfAccident || !userId) return;
    
    const fetchTimes = async () => {
      try {
        const timesRef = ref(database, 
          `location/${userId}/coordinates/${formData.vehicleId}/${formData.dateOfAccident}`);
        const snapshot = await get(timesRef);
        if (snapshot.exists()) {
          setAvailableTimes(Object.keys(snapshot.val()).map(time => time.substring(0, 5)));
        } else {
          setAvailableTimes([]);
        }
      } catch (error) {
        console.error('Error fetching times:', error);
      }
    };

    fetchTimes();
  }, [formData.vehicleId, formData.dateOfAccident, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location) => {
    setMapLocation(location);
    setMapError(null);
    setFormData(prev => ({
      ...prev,
      accidentLocation: {
        accidentLatitude: location.lat,  // Fixed typo from accidentLatiude to accidentLatitude
        accidentLongitude: location.lng,
        boundingBoxOfAccident: generateBoundingBox(location.lat, location.lng)
      }
    }));
  };

  const handleMapError = (error) => {
    setMapError(error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    
    try {
      if (!formData.accidentLocation) {
        throw new Error('Please select a location on the map');
      }
  
      const reportData = {
        vehicleId: formData.vehicleId,
        dateOfAccident: formData.dateOfAccident,
        timeOfAccident: formData.timeOfAccident + ':00',
        dateAndTimeOfReport: new Date().toISOString(),
        accidentDescription: formData.accidentDescription,
        accidentLocation: {
          latitude: formData.accidentLocation.accidentLatitude,
          longitude: formData.accidentLocation.accidentLongitude,
          boundingBox: formData.accidentLocation.boundingBoxOfAccident
        },
        status: 'pending'
      };
  
      const reportDate = new Date().toISOString().split('T')[0];
      const newReportRef = push(ref(database, `HitAndRunCaseReport/${userId}/${reportDate}`));
      await set(newReportRef, reportData);
      
      onClose();
      setFormData({
        vehicleId: '',
        dateOfAccident: '',
        timeOfAccident: '',
        accidentDescription: '',
        accidentLocation: null
      });
      setMapLocation(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          New Hit & Run Case Report
        </Typography>
        
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle ID</InputLabel>
                  <Select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    required
                    label="Vehicle ID"
                  >
                    {vehicles.map(vehicle => (
                      <MenuItem key={vehicle} value={vehicle}>{vehicle}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {formData.vehicleId && (
                  <FormControl fullWidth>
                    <InputLabel>Accident Date</InputLabel>
                    <Select
                      name="dateOfAccident"
                      value={formData.dateOfAccident}
                      onChange={handleChange}
                      required
                      label="Accident Date"
                    >
                      {availableDates.map(date => (
                        <MenuItem key={date} value={date}>{date}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {formData.dateOfAccident && (
                  <FormControl fullWidth>
                    <InputLabel>Accident Time</InputLabel>
                    <Select
                      name="timeOfAccident"
                      value={formData.timeOfAccident}
                      onChange={handleChange}
                      required
                      label="Accident Time"
                    >
                      {availableTimes.map(time => (
                        <MenuItem key={time} value={time}>{time}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <TextField
                  name="accidentDescription"
                  label="Accident Description"
                  multiline
                  rows={4}
                  required
                  fullWidth
                  value={formData.accidentDescription}
                  onChange={handleChange}
                  placeholder="Please describe what happened..."
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Select Accident Location
              </Typography>
              
              {mapError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {mapError}
                </Alert>
              )}
              
              <Box sx={{ height: 400, mb: 2 }}>
                <OSMMapPicker 
                  onLocationSelect={handleLocationSelect}
                  onError={handleMapError}
                  initialLocation={mapLocation}
                />
              </Box>

              {formData.accidentLocation && (
                <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Location Coordinates
                  </Typography>
                  <Typography variant="body2">
                    Latitude: {formData.accidentLocation.accidentLatitude.toFixed(6)}
                    <br />
                    Longitude: {formData.accidentLocation.accidentLongitude.toFixed(6)}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={onClose} variant="outlined" disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !formData.accidentLocation}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default CaseRegistrationModal;
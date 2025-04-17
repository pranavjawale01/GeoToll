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
  width: '95%',  // Increased from 90%
  maxWidth: '1200px',  // Increased maximum width
  height: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 3,
  overflow: 'auto'
};

const generateBoundingBox = (lat, lng, distance = 1) => {
  const earthRadius = 6371;
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
  const [pathData, setPathData] = useState([]);

  useEffect(() => {
    if (!open || !userId) return;
    
    const fetchVehicles = async () => {
      try {
        const vehiclesRef = ref(database, `location/${userId}/coordinates`);
        const snapshot = await get(vehiclesRef);
        if (snapshot.exists()) {
          const vehicleIds = Object.keys(snapshot.val())
            .filter(v => v && v.trim() !== '' && v.toLowerCase() !== 'null');
          setVehicles(vehicleIds);
        } else {
          setVehicles([]);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, [open, userId]);

  useEffect(() => {
    if (!formData.vehicleId || !userId) return;
    
    const fetchDates = async () => {
      try {
        const datesRef = ref(database, `location/${userId}/coordinates/${formData.vehicleId}`);
        const snapshot = await get(datesRef);
        if (snapshot.exists()) {
          const dates = Object.keys(snapshot.val())
            .filter(date => {
              if (date === 'totalDistance' || date === 'totalHighwayDistance') return false;
              const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
              return dateRegex.test(date);
            })
            .sort((a, b) => {
              const [dayA, monthA, yearA] = a.split('-').map(Number);
              const [dayB, monthB, yearB] = b.split('-').map(Number);
              if (yearA !== yearB) return yearB - yearA;
              if (monthA !== monthB) return monthB - monthA;
              return dayB - dayA;
            });
          setAvailableDates(dates);
        } else {
          setAvailableDates([]);
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
      }
    };

    fetchDates();
  }, [formData.vehicleId, userId]);

  useEffect(() => {
    if (!formData.vehicleId || !formData.dateOfAccident || !userId) return;
    
    const fetchTimes = async () => {
      try {
        const timesRef = ref(database, 
          `location/${userId}/coordinates/${formData.vehicleId}/${formData.dateOfAccident}`);
        const snapshot = await get(timesRef);
        
        if (snapshot.exists()) {
          const timeData = snapshot.val();
          const times = Object.keys(timeData)
            .filter(time => ![
              'today', 
              'todayTotalDistance', 
              'todayTotalHighwayDistance',
              'totalDistance',
              'totalHighwayDistance'
            ].includes(time))
            .sort((a, b) => {
              const toSeconds = (time) => {
                const [hh, mm, ss] = time.split(':').map(Number);
                return hh * 3600 + mm * 60 + ss;
              };
              return toSeconds(a) - toSeconds(b);
            });
          
          setAvailableTimes(times);
        } else {
          setAvailableTimes([]);
        }
      } catch (error) {
        console.error('Error fetching times:', error);
        setAvailableTimes([]);
      }
    };

    fetchTimes();
  }, [formData.vehicleId, formData.dateOfAccident, userId]);

  useEffect(() => {
    if (!formData.vehicleId || !formData.dateOfAccident || !userId) return;
    
    const fetchPathData = async () => {
      try {
        const pathRef = ref(database, 
          `location/${userId}/coordinates/${formData.vehicleId}/${formData.dateOfAccident}`);
        const snapshot = await get(pathRef);
        if (snapshot.exists()) {
          const data = [];
          Object.entries(snapshot.val()).forEach(([time, value]) => {
            if (time === 'today' || 
                time === 'todayTotalDistance' || 
                time === 'todayTotalHighwayDistance') {
              return;
            }
            
            if (value.latitude && value.longitude) {
              const highwayStatus = typeof value.isOnHighway === 'boolean' 
                ? (value.isOnHighway ? 1 : 0)
                : Number(value.isOnHighway) || 0;
              
              data.push({
                time,
                isOnHighway: highwayStatus,
                latitude: parseFloat(value.latitude),
                longitude: parseFloat(value.longitude)
              });
            }
          });
          
          data.sort((a, b) => a.time.localeCompare(b.time));
          setPathData(data);
        } else {
          setPathData([]);
        }
      } catch (error) {
        console.error('Error fetching path data:', error);
      }
    };

    fetchPathData();
  }, [formData.vehicleId, formData.dateOfAccident, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location) => {
    const isOnPath = pathData.some(point => {
      const distance = Math.sqrt(
        Math.pow(point.latitude - location.lat, 2) + 
        Math.pow(point.longitude - location.lng, 2)
      );
      return distance < 0.001;
    });

    if (!isOnPath) {
      setMapError('Please select a location along the vehicle path');
      return;
    }

    setMapLocation(location);
    setMapError(null);
    setFormData(prev => ({
      ...prev,
      accidentLocation: {
        accidentLatitude: location.lat,
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
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
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
                        <MenuItem key={date} value={date}>
                          {date.split('-').reverse().join('-')}
                        </MenuItem>
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
                        <MenuItem key={time} value={time}>
                          {time}
                        </MenuItem>
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

            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Accident Location
              </Typography>
              
              {mapError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {mapError}
                </Alert>
              )}
              
              <Box sx={{ flex: 1, minHeight: 400 }}>
                <OSMMapPicker 
                  onLocationSelect={handleLocationSelect}
                  onError={handleMapError}
                  initialLocation={mapLocation}
                  pathData={pathData}
                />
              </Box>

              {formData.accidentLocation && (
                <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, mt: 2 }}>
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
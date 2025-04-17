import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { database } from '../../firebase';
import { ref, push, set, get } from 'firebase/database';
import MapPicker from './MapPicker';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
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

  // Fetch vehicles for this user
  useEffect(() => {
    if (!open || !userId) return;
    
    const fetchVehicles = async () => {
      const vehiclesRef = ref(database, `location/${userId}/coordinates`);
      const snapshot = await get(vehiclesRef);
      if (snapshot.exists()) {
        setVehicles(Object.keys(snapshot.val()));
      }
    };

    fetchVehicles();
  }, [open, userId]);

  // Fetch dates when vehicle is selected
  useEffect(() => {
    if (!formData.vehicleId || !userId) return;
    
    const fetchDates = async () => {
      const datesRef = ref(database, `location/${userId}/coordinates/${formData.vehicleId}`);
      const snapshot = await get(datesRef);
      if (snapshot.exists()) {
        setAvailableDates(Object.keys(snapshot.val()));
      }
    };

    fetchDates();
  }, [formData.vehicleId, userId]);

  // Fetch times when date is selected
  useEffect(() => {
    if (!formData.vehicleId || !formData.dateOfAccident || !userId) return;
    
    const fetchTimes = async () => {
      const timesRef = ref(database, 
        `location/${userId}/coordinates/${formData.vehicleId}/${formData.dateOfAccident}`);
      const snapshot = await get(timesRef);
      if (snapshot.exists()) {
        setAvailableTimes(Object.keys(snapshot.val()).map(time => time.substring(0, 5)));
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
    setFormData(prev => ({
      ...prev,
      accidentLocation: {
        accidentLatiude: location.lat,
        accidentLongitude: location.lng,
        boundingBoxOfAccident: generateBoundingBox(location.lat, location.lng)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.accidentLocation) {
        throw new Error('Please select a location on the map');
      }

      const reportData = {
        vehicleId: formData.vehicleId,
        dateOfAccident: formData.dateOfAccident,
        timeOfAccident: formData.timeOfAccident + ':00', // Add seconds
        dateAndTimeOfReport: new Date().toISOString(),
        accidentDescription: formData.accidentDescription,
        accidentLocation: formData.accidentLocation,
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          New Hit & Run Case Report
        </Typography>
        <form onSubmit={handleSubmit}>
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
            />

            <Typography variant="subtitle1">Select Accident Location</Typography>
            <Box sx={{ height: 400 }}>
              <MapPicker 
                onLocationSelect={handleLocationSelect}
                initialLocation={mapLocation}
              />
            </Box>

            {formData.accidentLocation && (
              <Box>
                <Typography variant="subtitle2">Selected Location</Typography>
                <Typography>
                  Latitude: {formData.accidentLocation.accidentLatiude.toFixed(6)}, 
                  Longitude: {formData.accidentLocation.accidentLongitude.toFixed(6)}
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Bounding Box (5km radius)</Typography>
                <Typography>
                  X: {formData.accidentLocation.boundingBoxOfAccident.xmin.toFixed(6)} to {formData.accidentLocation.boundingBoxOfAccident.xmax.toFixed(6)},<br />
                  Y: {formData.accidentLocation.boundingBoxOfAccident.ymin.toFixed(6)} to {formData.accidentLocation.boundingBoxOfAccident.ymax.toFixed(6)}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onClose} variant="outlined">Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || !formData.accidentLocation}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};

export default CaseRegistrationModal;
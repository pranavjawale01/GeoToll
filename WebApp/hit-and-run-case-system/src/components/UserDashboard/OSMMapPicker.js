import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, CircularProgress } from '@mui/material';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const OSMMapPicker = ({ onLocationSelect, initialLocation }) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);

  // Default center (can be changed)
  const defaultCenter = [18.5204, 73.8567]; // Pune, India coordinates
  const zoomLevel = 14;

  // Component to handle map click events
  const MapClickHandler = ({ onClick }) => {
    useMapEvents({
      click: (e) => {
        onClick(e.latlng);
      },
    });
    return null;
  };

  const handleMapClick = (location) => {
    setSelectedLocation(location);
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
    });
  };

  useEffect(() => {
    setMapReady(true);
    if (initialLocation) {
      setSelectedLocation({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
      });
    }
  }, [initialLocation]);

  return (
    <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
      {!mapReady ? (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <MapContainer
          center={selectedLocation || defaultCenter}
          zoom={zoomLevel}
          style={{ height: '100%', width: '100%', borderRadius: '4px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onClick={handleMapClick} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>Selected Location</Popup>
            </Marker>
          )}
        </MapContainer>
      )}
    </Box>
  );
};

export default OSMMapPicker;
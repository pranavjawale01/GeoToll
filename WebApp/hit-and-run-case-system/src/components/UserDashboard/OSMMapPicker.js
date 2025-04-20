import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents } from 'react-leaflet';
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

const getColorForHighwayStatus = (status) => {
  switch(status) {
    case 0: return 'red';
    case 1: return 'blue';
    case 2: return 'yellow';
    default: return 'gray';
  }
};

const generateBoundingBoxCoords = (lat, lng, distance = 1) => {
  const earthRadius = 6371; // km
  const latDelta = distance / earthRadius * (180 / Math.PI);
  const lngDelta = distance / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  
  return [
    [lat - latDelta, lng - lngDelta], // SW
    [lat - latDelta, lng + lngDelta], // SE
    [lat + latDelta, lng + lngDelta], // NE
    [lat + latDelta, lng - lngDelta]  // NW
  ];
};

const OSMMapPicker = ({ onLocationSelect, initialLocation, pathData }) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [boundingBox, setBoundingBox] = useState(null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Create a single continuous path with color changes
  const getPathWithColorChanges = () => {
    if (pathData.length === 0) return null;

    const pathSegments = [];
    let currentSegment = {
      color: getColorForHighwayStatus(pathData[0].isOnHighway),
      points: [[pathData[0].latitude, pathData[0].longitude]]
    };

    for (let i = 1; i < pathData.length; i++) {
      const currentColor = getColorForHighwayStatus(pathData[i].isOnHighway);
      if (currentColor === currentSegment.color) {
        currentSegment.points.push([pathData[i].latitude, pathData[i].longitude]);
      } else {
        pathSegments.push(currentSegment);
        currentSegment = {
          color: currentColor,
          points: [[pathData[i].latitude, pathData[i].longitude]]
        };
      }
    }
    pathSegments.push(currentSegment);

    return pathSegments.map((segment, index) => (
      <Polyline
        key={index}
        positions={segment.points}
        color={segment.color}
        weight={4}
        opacity={0.7}
      />
    ));
  };

  // Component to handle map click events
  const MapClickHandler = ({ onClick }) => {
    useMapEvents({
      click: (e) => {
        const location = e.latlng;
        onClick(location);
        setBoundingBox(generateBoundingBoxCoords(location.lat, location.lng));
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
      setBoundingBox(generateBoundingBoxCoords(initialLocation.lat, initialLocation.lng));
    }
  }, [initialLocation]);

  // Fit map to bounds when path data changes
  useEffect(() => {
    if (mapReady && pathData.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        pathData.map(point => [point.latitude, point.longitude])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pathData, mapReady]);

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        height: '100%',
        width: '100%',
        position: 'relative',
        minHeight: '500px',
        flex: '1 1 auto',
        overflow: 'hidden',
      }}
    >
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
          <CircularProgress size={24} />
        </Box>
      ) : (
        <MapContainer
          center={selectedLocation || [18.5204, 73.8567]}
          zoom={14}
          style={{ 
            height: '100%', 
            width: '100%', 
            borderRadius: '4px',
            margin: 0,
            padding: 0,
          }}
          ref={mapRef}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {getPathWithColorChanges()}
          
          {/* Render bounding box if location is selected */}
          {boundingBox && (
            <Polygon
              positions={boundingBox}
              color="#006400"
              fillColor="#90EE90"
              fillOpacity={0.2}
              weight={2}
            />
          )}
          
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
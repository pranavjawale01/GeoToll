import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const UserMap = ({ locations }) => {
  if (!locations || locations.length === 0) return null;

  const startLocation = locations[0];  // First location (start point)
  const endLocation = locations[locations.length - 1];  // Last location (end point)
  
  const polylinePositions = locations.map(location => [location.latitude, location.longitude]);

  return (
    <MapContainer center={[startLocation.latitude, startLocation.longitude]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Marker at the start location */}
      <Marker position={[startLocation.latitude, startLocation.longitude]} />
      
      {/* Marker at the end location */}
      <Marker position={[endLocation.latitude, endLocation.longitude]} />
      
      {/* Polyline connecting all the locations */}
      <Polyline positions={polylinePositions} color="blue" />
    </MapContainer>
  );
};

export default UserMap;

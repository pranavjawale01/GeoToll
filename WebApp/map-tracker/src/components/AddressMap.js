// Map.js
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet"; // For custom markers
import "leaflet/dist/leaflet.css";

const Map = ({ onLocationSelect }) => {
  const [markerPosition, setMarkerPosition] = useState(null);

  const MapClick = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition({ lat, lng });
        onLocationSelect(lat, lng); // Send the selected lat, lng to parent component
      },
    });

    return markerPosition ? (
      <Marker position={markerPosition}>
        <Popup>
          Selected Location: {markerPosition.lat}, {markerPosition.lng}
        </Popup>
      </Marker>
    ) : null;
  };

  return (
    <MapContainer center={[19.0760, 72.8777]} zoom={10} style={{ width: "100%", height: "500px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClick />
    </MapContainer>
  );
};

export default Map;

import React, { useEffect, useRef } from 'react';
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const MapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const [center, setCenter] = useState(initialLocation || { lat: 18.5204, lng: 73.8567 });
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  const handleMapClick = (e) => {
    const location = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  useEffect(() => {
    if (initialLocation) {
      setCenter(initialLocation);
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onClick={handleMapClick}
        ref={mapRef}
      >
        {selectedLocation && (
          <Marker position={selectedLocation} />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapPicker;
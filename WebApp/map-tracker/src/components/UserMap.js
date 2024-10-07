import React from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const UserMap = ({ locations }) => {
  if (!locations || locations.length === 0) return null;

  const startLocation = locations[0];
  const endLocation = locations[locations.length - 1];

  // Separate locations based on whether they are on the highway or not
  const highwayPositions = [];
  const serviceRoadPositions = [];

  locations.forEach((location) => {
    const position = [location.latitude, location.longitude];
    if (location.isOnHighway) {
      highwayPositions.push(position);
    } else {
      serviceRoadPositions.push(position);
    }
  });

  return (
    <MapContainer
      center={[startLocation.latitude, startLocation.longitude]}
      zoom={13}
      style={{ height: "100%", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />

      <Marker position={[startLocation.latitude, startLocation.longitude]} />
      <Marker position={[endLocation.latitude, endLocation.longitude]} />

      {/* Highway route in blue */}
      {highwayPositions.length > 0 && (
        <Polyline positions={highwayPositions} color="blue" />
      )}

      {/* Service road route in red */}
      {serviceRoadPositions.length > 0 && (
        <Polyline positions={serviceRoadPositions} color="red" />
      )}
    </MapContainer>
  );
};

export default UserMap;

// import React from "react";
// import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// const UserMap = ({ locations }) => {
//   if (!locations || locations.length === 0) return null;

//   const startLocation = locations[0]; // First location (start point)
//   const endLocation = locations[locations.length - 1]; // Last location (end point)

//   const polylinePositions = locations.map((location) => [
//     location.latitude,
//     location.longitude,
//   ]);

//   return (
//     <MapContainer
//       center={[startLocation.latitude, startLocation.longitude]}
//       zoom={13}
//       style={{ height: "100%", width: "100%", borderRadius: "8px" }} // Styling to improve the map design
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
//       />

//       {/* Marker at the start location */}
//       <Marker position={[startLocation.latitude, startLocation.longitude]} />

//       {/* Marker at the end location */}
//       <Marker position={[endLocation.latitude, endLocation.longitude]} />

//       {/* Polyline connecting all the locations */}
//       <Polyline positions={polylinePositions} color="blue" />
//     </MapContainer>
//   );
// };

// export default UserMap;

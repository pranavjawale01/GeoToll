import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-arrowheads";

const UserMap = ({ locations }) => {
  // Set the start and end locations for the route
  const startLocation = locations[0];
  const endLocation = locations[locations.length - 1];

  const startMarker = useMemo(
    () => [startLocation.latitude, startLocation.longitude],
    [startLocation]
  );

  const endMarker = useMemo(
    () => [endLocation.latitude, endLocation.longitude],
    [endLocation]
  );
  if (!locations || locations.length === 0) return null;

  // Function to split locations into segments based on highway status
  const getPolylineSegments = () => {
    const segments = []; // Array to hold segments of polyline
    let currentSegment = []; // Array to hold the current segment's locations
    let currentStatus = locations[0].isOnHighway;

    locations.forEach((location, index) => {
      const position = [location.latitude, location.longitude];

      // Always push the current position to the segment
      currentSegment.push(position);

      // Check if the next location status changes
      if (
        index < locations.length - 1 &&
        locations[index + 1].isOnHighway !== currentStatus
      ) {
        // When status changes, push the current segment and start a new one
        segments.push({
          positions: currentSegment,
          isOnHighway: currentStatus,
        });
        currentSegment = [position]; // Start the new segment with the last point to ensure continuity
        currentStatus = locations[index + 1].isOnHighway;
      }
    });

    // Push the last segment
    if (currentSegment.length > 0) {
      segments.push({ positions: currentSegment, isOnHighway: currentStatus });
    }

    return segments; // Return the array of polyline segments
  };

  const polylineSegments = getPolylineSegments();

  // Custom hook to add arrowheads to polylines
  const AddArrows = ({ segments }) => {
    const map = useMap();

    // Fit bounds to all locations on map load
    useEffect(() => {
      if (locations.length > 1) {
        const bounds = L.latLngBounds(
          locations.map((loc) => [loc.latitude, loc.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [map]);

    useEffect(() => {
      segments.forEach((segment) => {
        // Determine color based on the isOnHighway value
        let color;
        if (segment.isOnHighway === 1 || segment.isOnHighway === true) {
          color = "blue"; // Highway
        } else if (segment.isOnHighway === 0 || segment.isOnHighway === false) {
          color = "red"; // Service road or alternate route
        } else if (segment.isOnHighway === 2) {
          color = "yellow"; // New condition for isOnHighway === 2
        }

        // Create polyline with the selected color
        const polyline = L.polyline(segment.positions, {
          color: color,
        }).addTo(map);

        // Add arrowheads to the polyline
        polyline.arrowheads({
          frequency: "200px", // distance between arrows
          size: "8px", // arrow size
          fill: true,
          color: color,
        });
      });

      return () => {
        // Clear the map when the component unmounts or updates
        map.eachLayer((layer) => {
          if (layer instanceof L.Polyline && !layer._latlng) {
            map.removeLayer(layer);
          }
        });
      };
    }, [map, segments]);

    return null;
  };

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

      {/* Start and end markers */}
      <Marker position={startMarker} />
      <Marker position={endMarker} />

      {/* Draw polylines with arrows */}
      <AddArrows segments={polylineSegments} />
    </MapContainer>
  );
};

export default UserMap;

///////////////////////////////////////////////
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

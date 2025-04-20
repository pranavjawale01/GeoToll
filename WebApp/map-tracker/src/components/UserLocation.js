// src/components/UserLocation.js
import { useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "../firebase"; // Import the initialized database

const UserLocation = ({
  userId,
  selectedVehicle,
  selectedDate,
  onLocationsUpdate,
}) => {
  useEffect(() => {
    // Ensure all necessary data is available before proceeding
    if (!userId || !selectedVehicle || !selectedDate) {
      return; // Exit if any required parameter is missing
    }

    // Correct reference to include selected vehicle and date
    const locationRef = ref(
      database,
      `location/${userId}/coordinates/${selectedVehicle}/${selectedDate}`
    );

    // Listen for real-time updates to fetch location data
    onValue(
      locationRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const newLocations = []; // Array to hold location data for the selected date

          // Check if data exists and is valid
          if (data && typeof data === "object") {
            Object.keys(data).forEach((timeKey) => {
              const point = data[timeKey]; // Get the location data at this time entry
              if (point && point.latitude && point.longitude) {
                newLocations.push({
                  latitude: point.latitude,
                  longitude: point.longitude,
                  isOnHighway: point.isOnHighway,
                });
              }
            });

            // Pass updated locations to the parent component
            onLocationsUpdate(newLocations);
          }
        } else {
          // No data found, reset locations
          onLocationsUpdate([]);
        }
      },
      (error) => {
        console.error("Error fetching location data:", error);
        onLocationsUpdate([]);
      }
    );

    // Cleanup listener when component unmounts or dependencies change
    return () => {
      off(locationRef); // Detach the listener
      onLocationsUpdate([]); // Clear data on unmount
    };
  }, [userId, selectedVehicle, selectedDate, onLocationsUpdate]);

  return null; // No UI component, just fetching data
};

export default UserLocation;

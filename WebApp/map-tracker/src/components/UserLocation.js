import { useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase"; // Import the initialized database

const UserLocation = ({
  userId,
  selectedDate,
  onLocationsUpdate,
  onAvailableDatesUpdate,
}) => {
  useEffect(() => {
    const locationRef = ref(database, `location/${userId}/coordinates`);

    // Listen for real-time updates to get available dates
    onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        // Ensure that data exists and is valid before proceeding
        if (data && typeof data === "object") {
          const availableDates = Object.keys(data);

          // Update available dates in Dashboard
          onAvailableDatesUpdate(availableDates);

          if (selectedDate && data[selectedDate]) {
            const newLocations = []; // Array to hold the location data for the selected date

            // Retrieve time entries for the selected date
            const timeEntries = data[selectedDate];

            // Checked if timeEntries is a valid object
            if (timeEntries && typeof timeEntries === "object") {
              Object.keys(timeEntries).forEach((timeKey) => {
                const point = timeEntries[timeKey]; // Get the location data at this time entry
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
          }
        }
      }
    });
  }, [userId, selectedDate, onLocationsUpdate, onAvailableDatesUpdate]);

  return null; // No UI component here, just passing the data
};

export default UserLocation;

// import { useEffect } from "react";

// //  array of geolocation points
// const simulatedLocations = [
//   { latitude: 18.58437, longitude: 73.73623 },
//   { latitude: 18.58407, longitude: 73.73676 },
//   { latitude: 18.58367, longitude: 73.73637 },
//   { latitude: 18.5844, longitude: 73.73531 },
//   { latitude: 18.58592, longitude: 73.73653 },
//   { latitude: 18.58679, longitude: 73.73727 },
//   { latitude: 18.58614, longitude: 73.73833 },
//   { latitude: 18.58205, longitude: 73.73917 },
//   { latitude: 18.58308, longitude: 73.73747 },
//   { latitude: 18.58354, longitude: 73.73657 },
// ];

// const UserLocation = ({ onLocationsUpdate }) => {
//   useEffect(() => {
//     // delay as if we were fetching data
//     setTimeout(() => {
//       onLocationsUpdate(simulatedLocations); // Passing simulated points
//     }, 1000); // network delay
//   }, [onLocationsUpdate]);

//   return null;
// };

// export default UserLocation;

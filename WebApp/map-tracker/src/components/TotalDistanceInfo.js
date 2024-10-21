import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase"; // Import your Firebase config

const TotalDistanceInfo = ({ userId }) => {
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalHighwayDistance, setTotalHighwayDistance] = useState(0);

  useEffect(() => {
    if (userId) {
      // Reference to the coordinates for the user
      const totalDistanceRef = ref(database, `location/${userId}`);

      // Listen for changes in the database
      onValue(totalDistanceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("Fetched Data:", data); // Log fetched data

          if (data) {
            // Directly access totalDistance and totalHighwayDistance
            const totalDistance = data.totalDistance || 0;
            const totalHighwayDistance = data.totalHighwayDistance || 0;

            // Set state with the fetched values
            setTotalDistance(totalDistance);
            setTotalHighwayDistance(totalHighwayDistance);
          }
        } else {
          console.log("No data available for this user."); // Log when no data exists
          setTotalDistance(0);
          setTotalHighwayDistance(0);
        }
      });
    }
  }, [userId]);

  return (
    <div>
      <h3>Total Distance Information</h3>
      <p>Total Distance: {totalDistance.toFixed(2)} meters</p>
      <p>Total Highway Distance: {totalHighwayDistance.toFixed(2)} meters</p>
    </div>
  );
};

export default TotalDistanceInfo;

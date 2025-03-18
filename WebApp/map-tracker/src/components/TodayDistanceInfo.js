import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase"; // Firebase config

const TodayDistanceInfo = ({
  userId,
  selectedVehicle,
  selectedDate,
  onTollUpdate,
}) => {
  const [todayTotalDistance, setTodayTotalDistance] = useState(0);
  const [todayTotalHighwayDistance, setTodayTotalHighwayDistance] = useState(0);
  // const [todayTotalCost, setTodayTotalCost] = useState(0);

  useEffect(() => {
    if (userId && selectedVehicle && selectedDate) {
      const todayDistanceRef = ref(
        database,
        `location/${userId}/coordinates/${selectedVehicle}/${selectedDate}`
      );

      onValue(todayDistanceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("Fetched Data:", data); // Log fetched data

          if (data) {
            // Directly access todayTotalDistance and todayTotalHighwayDistance
            const totalDistance = data.todayTotalDistance / 1000 || 0;
            const totalHighwayDistance =
              data.todayTotalHighwayDistance / 1000 || 0;

            // console.log("Total Distance:", totalDistance); // Log total distance
            // console.log("Total Highway Distance:", totalHighwayDistance); // Log total highway distance

            setTodayTotalDistance(totalDistance);
            setTodayTotalHighwayDistance(totalHighwayDistance);

            // Calculate today's toll cost
            const costPerkm = 0.5; // Cost per unit distance
            const freeDistance = 20; // Free distance in meters
            const todayTotalCost =
              totalHighwayDistance > freeDistance
                ? costPerkm * (totalHighwayDistance - freeDistance)
                : 0;

            //setTodayTotalCost(todayTotalCost);

            // Pass the toll cost to the parent via callback
            if (onTollUpdate) {
              onTollUpdate(todayTotalCost);
            }
          }
        } else {
          console.log("No data for the selected date."); // Log when no data exists
          setTodayTotalDistance(0);
          setTodayTotalHighwayDistance(0);
          //setTodayTotalCost(0);
          if (onTollUpdate) {
            onTollUpdate(0);
          }
        }
      });
    }
  }, [userId, selectedVehicle, selectedDate, onTollUpdate]);

  return (
    <div>
      <h4 style={{ marginBottom: "5px" }}>Today's Distance Traveled</h4>
      <p style={{ margin: "2px 0" }}>
        Total Distance (Today): {todayTotalDistance.toFixed(2)} Km
      </p>
      <p style={{ margin: "2px 0" }}>
        Total Highway Distance (Today): {todayTotalHighwayDistance.toFixed(2)}{" "}
        Km
      </p>
    </div>
  );
};

export default TodayDistanceInfo;

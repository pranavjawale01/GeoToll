import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase"; // Firebase config

const TodayDistanceInfo = ({ userId, selectedDate }) => {
  const [todayTotalDistance, setTodayTotalDistance] = useState(0);
  const [todayTotalHighwayDistance, setTodayTotalHighwayDistance] = useState(0);

  useEffect(() => {
    if (userId && selectedDate) {
      const todayDistanceRef = ref(
        database,
        `location/${userId}/coordinates/${selectedDate}`
      );

      onValue(todayDistanceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("Fetched Data:", data); // Log fetched data

          if (data) {
            // Directly access todayTotalDistance and todayTotalHighwayDistance
            const totalDistance = data.todayTotalDistance || 0;
            const totalHighwayDistance = data.todayTotalHighwayDistance || 0;

            // console.log("Total Distance:", totalDistance); // Log total distance
            // console.log("Total Highway Distance:", totalHighwayDistance); // Log total highway distance

            setTodayTotalDistance(totalDistance);
            setTodayTotalHighwayDistance(totalHighwayDistance);
          }
        } else {
          console.log("No data for the selected date."); // Log when no data exists
          setTodayTotalDistance(0);
          setTodayTotalHighwayDistance(0);
        }
      });
    }
  }, [userId, selectedDate]);

  return (
    <div>
      <h3>Today's Distance Traveled</h3>
      <p>Total Distance (Today): {todayTotalDistance.toFixed(2)} meters</p>
      <p>
        Total Highway Distance (Today): {todayTotalHighwayDistance.toFixed(2)}{" "}
        meters
      </p>
    </div>
  );
};

export default TodayDistanceInfo;

import React, { useEffect } from 'react';

//  array of locations
const simulatedLocations = [
  { latitude: 18.58437, longitude: 73.73623 }, 
  { latitude: 18.58407, longitude: 73.73676 }, 
  { latitude: 18.58367, longitude: 73.73637 },  
  { latitude: 18.58440, longitude: 73.73531 },
  { latitude: 18.58592, longitude: 73.73653 },  
  { latitude: 18.58679, longitude: 73.73727 },  
  { latitude: 18.58614, longitude: 73.73833 },
  { latitude: 18.58205, longitude: 73.73917 },
  { latitude: 18.58308, longitude: 73.73747 },
  { latitude: 18.58354, longitude: 73.73657 },
  
];

const UserLocation = ({ onLocationsUpdate }) => {
  useEffect(() => {
    // delay as if we were fetching data
    setTimeout(() => {
      onLocationsUpdate(simulatedLocations);  // Passing simulated points
    }, 1000);  // network delay
  }, [onLocationsUpdate]);

  return null;
};

export default UserLocation;

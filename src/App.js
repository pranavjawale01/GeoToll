import React, { useState } from 'react';
import UserLocation from './components/UserLocation';
import UserMap from './components/UserMap';

const App = () => {
  const [locations, setLocations] = useState([]);
  
  return (
    <div>
      <h1>User Location Tracker</h1>
      <UserLocation onLocationsUpdate={setLocations} />
      {locations.length > 0 && <UserMap locations={locations} />}
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import UserLocation from './UserLocation';
import UserMap from './UserMap';

const Dashboard = () => {
  const [locations, setLocations] = useState([]);

  return (
    <div>
      <h1>User Dashboard</h1>
      <UserLocation onLocationsUpdate={setLocations} />
      {locations.length > 0 && <UserMap locations={locations} />}
    </div>
  );
};

export default Dashboard;

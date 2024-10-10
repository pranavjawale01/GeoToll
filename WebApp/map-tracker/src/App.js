import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ProfileForm from "./components/ProfileForm";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import Navbar from "./components/Navbar";

// Create a wrapper component to conditionally render the Navbar
const AppLayout = ({ children }) => {
  const location = useLocation();

  // Determine if the current path should have the Navbar
  const showNavbar = !["/", "/signup"].includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfileForm />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
};

export default App;

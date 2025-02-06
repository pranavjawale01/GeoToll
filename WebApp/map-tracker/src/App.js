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
import ForgotPassword from "./components/ForgotPassword"; // Import the ForgotPassword component
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import Navbar from "./components/Navbar";

// Created a wrapper component to conditionally render the Navbar
const AppLayout = ({ children }) => {
  const location = useLocation();

  // Navbar is not displayed on the login, signup, and forgot-password pages.
  const showNavbar = !["/", "/signup", "/forgot-password"].includes(
    location.pathname
  );

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
        <Routes>
          {/* Pages without Navbar */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Pages with Navbar */}
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfileForm />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

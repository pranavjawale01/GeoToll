import React, { useEffect, useState } from "react";
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
import ForgotPassword from "./components/ForgotPassword";
import PenaltyTable from "./components/PenaltyHistory";
import HighwayDistanceTable from "./components/TollCharge";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import SessionManager from "./components/SessionManager";
import { onAuthStateChanged, getAuth } from "firebase/auth";

// ⛳ Layout wrapper to conditionally show Navbar
const AppLayout = ({ children }) => {
  const location = useLocation();
  const showNavbar = !["/", "/signup", "/forgot-password"].includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <Router>
        {/* ✅ Always load SessionManager at top level if user is logged in */}
        {user && <SessionManager />}

        <Routes>
          {/* Routes without Navbar */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Routes with Navbar */}
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfileForm />} />
                  <Route path="/penalties" element={<PenaltyTable />} />
                  <Route path="/toll-history" element={<HighwayDistanceTable />} />
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

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null); // State to store the currently authenticated user's ID

  // useEffect hook to monitor authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    // Cleanup function to unsubscribe from auth state changes
    return () => unsubscribe();
  }, []);

  // Logout function to clear userId
  const logout = async () => {
    try {
      await signOut(auth); // Call Firebase signOut method
      setUserId(null); // Clear the userId in context
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ userId, logout }}>
      {" "}
      {/* Add logout to the context */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getDatabase, ref, remove } from "firebase/database";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        sessionStorage.removeItem("sessionId");
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const sessionId = sessionStorage.getItem("sessionId");
      if (sessionId) {
        // Cleanup session in Firebase
        const db = getDatabase();
        const sessionRef = ref(db, `activeSessions/${auth.currentUser.uid}/${sessionId}`);
        await remove(sessionRef); // <-- Remove session from Firebase
        sessionStorage.removeItem("sessionId"); // Clean up session storage
      }
      
      await signOut(auth);
      setUserId(null); // Ensure userId is reset
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import { useEffect } from "react";
import { ref, set, onValue, remove, onDisconnect } from "firebase/database";
import { auth, database } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const SessionManager = () => {
  const navigate = useNavigate();
  const sessionId = uuidv4();

  useEffect(() => {
    console.log("SessionManager mounted");

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);

      if (!user) return;

      const userId = user.uid;
      const sessionRef = ref(database, `activeSessions/${userId}`);
      const sessionData = {
        sessionId,
        timestamp: Date.now(),
      };

      console.log("Trying to set session:", sessionData);

      set(sessionRef, sessionData)
        .then(() => {
          console.log("Session set in DB");

          onDisconnect(sessionRef).remove();
        })
        .catch((error) => {
          console.error("Error setting session in DB:", error);
        });

      const unsubscribeSession = onValue(sessionRef, (snapshot) => {
        const data = snapshot.val();
        console.log("Session snapshot updated:", data);

        if (data && data.sessionId !== sessionId) {
          alert("Logged out due to another login.");
          navigate("/");
        }
      });

      const handleUnload = () => {
        console.log("Removing session on unload");
        remove(sessionRef);
      };
      window.addEventListener("beforeunload", handleUnload);

      return () => {
        unsubscribeSession();
        remove(sessionRef);
        window.removeEventListener("beforeunload", handleUnload);
      };
    });

    return () => unsubscribeAuth();
  }, []);

  return null;
};

export default SessionManager;

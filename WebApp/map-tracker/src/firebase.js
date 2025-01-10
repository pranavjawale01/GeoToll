import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAuXGeo-cntx-05XQlE70YQgc5UaqUe4pE",
  authDomain: "location-tracker-firebas-d970f.firebaseapp.com",
  databaseURL:
    "https://location-tracker-firebas-d970f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "location-tracker-firebas-d970f",
  storageBucket: "location-tracker-firebas-d970f.appspot.com",
  messagingSenderId: "36416331605",
  appId: "1:36416331605:web:f80e04314722f3e0da19dc",
  measurementId: "G-58L5L7WS4Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };

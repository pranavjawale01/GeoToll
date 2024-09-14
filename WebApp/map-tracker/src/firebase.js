import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAKpQk6vPIER7G68io7P7kDzOVU5o3hWRw",
  authDomain: "database-advanced-ui-ux.firebaseapp.com",
  databaseURL: "https://database-advanced-ui-ux-default-rtdb.firebaseio.com",
  projectId: "database-advanced-ui-ux",
  storageBucket: "database-advanced-ui-ux.appspot.com",
  messagingSenderId: "1082319930174",
  appId: "1:1082319930174:android:08360672d26b7df17fa26f"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };

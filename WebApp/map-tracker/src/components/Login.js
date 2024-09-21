import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Email and Password Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, contain a number, and a special character');
      return;
    }

    try {
      // Authenticate the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Retrieve user data from Firebase
      const userRef = ref(database, 'users/' + userId);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const storedUser = snapshot.val();

        // Update the user's login status
        await set(userRef, {
          ...storedUser,
          isLoggedIn: true // Set this to true on login
        });

        // Redirect to the dashboard
        navigate('/dashboard');
      } else {
        setError('User data not found.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Login</button>
      </form>
      {error && (
        <p className="error-message">{error}</p>
      )}
      <p>
        Don't have an account? <a href="/signup">Sign up here</a>
      </p>
    </div>
  );
};

export default Login;































// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleLogin = (e) => {
//     e.preventDefault();

//     // Email and Password Validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//     if (!emailRegex.test(email)) {
//       setError('Please enter a valid email address');
//       return;
//     }

//     if (!passwordRegex.test(password)) {
//       setError('Password must be at least 8 characters long, contain a number, and a special character');
//       return;
//     }

//     // Retrieve all users from local storage
//     const users = JSON.parse(localStorage.getItem('users')) || [];

//     // Debugging: Check what is retrieved from local storage
//     //console.log('Retrieved users from local storage:', users);

//     // Find the user with matching email and password (after trimming any extra spaces)
//     const storedUser = users.find((user) => 
//       user.email.trim() === email.trim() && user.password === password
//     );

//     // // Debugging: Check the comparison process
//     // console.log(`Comparing stored email: ${storedUser ? storedUser.email : 'not found'} with input email: ${email}`);
//     // console.log(`Comparing stored password: ${storedUser ? storedUser.password : 'not found'} with input password: ${password}`);

//     if (storedUser) {
//       // Mark the user as logged in
//       const updatedUsers = users.map(user => 
//         user.email === email ? { ...user, isLoggedIn: true } : user
//       );
//       localStorage.setItem('users', JSON.stringify(updatedUsers));

//       // Redirect to the dashboard
//       navigate('/dashboard');
//     } else {
//       // Invalid email or password
//       setError('Invalid email or password');
//     }
//   };

//   return (
//     <div className="form-container">
//       <h2>Login</h2>
//       <form onSubmit={handleLogin}>
//         <label>Email:</label>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <br />
//         <label>Password:</label>
//         <input
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <br />
//         <button type="submit">Login</button>
//       </form>
//       {error && (
//         <p className="error-message">{error}</p>
//       )}
//       <p>
//         Don't have an account? <a href="/signup">Sign up here</a>
//       </p>
//     </div>
//   );
// };

// export default Login;

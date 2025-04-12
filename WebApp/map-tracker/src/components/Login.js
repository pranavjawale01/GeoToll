import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, update, get } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Link,
  Alert,
  Avatar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1 = login, 2 = otp
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [tempUser, setTempUser] = useState(null); // to store temp user data

  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long, contain a number, and a special character"
      );
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;
      const userRef = ref(database, "users/" + userId);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const storedUser = snapshot.val();

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setStep(2);
        setTempUser({ userId, storedUser });

        // Send OTP to user's email
        await fetch("http://localhost:3000/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        });

        alert("OTP sent to your email.");
      } else {
        setError("User data not found.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (enteredOtp === generatedOtp) {
      try {
        const userRef = ref(database, "users/" + tempUser.userId);
        await update(userRef, {
          ...tempUser.storedUser,
          isLoggedIn: true,
        });
        navigate("/dashboard");
      } catch (err) {
        setError("OTP verified, but login update failed.");
      }
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
      }}
    >
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ minHeight: "100vh" }}
      >
        <Grid
          item
          xs={11}
          sm={8}
          md={6}
          lg={4}
          xl={3}
          sx={{
            padding: { xs: 2, sm: 3 },
            boxShadow: { xs: 5, sm: 10 },
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderRadius: 2,
            margin: "5%",
          }}
        >
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ padding: { xs: 2, sm: 4 } }}
          >
            {/* Avatar with Lock Icon */}
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ marginBottom: 2 }}
            >
              <Avatar sx={{ bgcolor: "#64B5F6" }}>
                <LockOutlinedIcon />
              </Avatar>
            </Box>

            <Typography variant="h4" gutterBottom align="center">
              {step === 1 ? "Login" : "Verify OTP"}
            </Typography>

            {step === 1 ? (
              <>
                <TextField
                  label="Email"
                  variant="outlined"
                  fullWidth
                  required
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <TextField
                  label="Password"
                  variant="outlined"
                  type="password"
                  fullWidth
                  required
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                  <Alert severity="error" sx={{ marginBottom: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ marginTop: 2 }}
                >
                  Login
                </Button>

                <Typography
                  variant="body2"
                  align="center"
                  sx={{ marginTop: 2 }}
                >
                  Don't have an account?{" "}
                  <Link href="/signup" underline="hover">
                    Sign up here
                  </Link>
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{ marginTop: 2 }}
                >
                  Forgot your password?{" "}
                  <Link href="/forgot-password" underline="hover">
                    Reset it here
                  </Link>
                </Typography>
              </>
            ) : (
              <>
                <TextField
                  label="Enter OTP"
                  variant="outlined"
                  fullWidth
                  required
                  margin="normal"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                />

                {error && (
                  <Alert severity="error" sx={{ marginBottom: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  onClick={handleVerifyOtp}
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ marginTop: 2 }}
                >
                  Verify OTP
                </Button>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;

//################   CODE FOR LOCAL STORAGE    #############

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

//###########   CODE BEFORE STYLING WITH MATERIAL UI    ##############

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { auth, database } from '../firebase'; // Ensure correct import
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { ref, set } from 'firebase/database';

// const Signup = () => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setError(''); // Reset error message
//     setLoading(true); // Prevent multiple submissions

//     // Validate phone number
//     if (!/^\d{10}$/.test(phone)) {
//       setError('Please enter a valid 10-digit phone number.');
//       setLoading(false);
//       return;
//     }

//     // Validate email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       setError('Please enter a valid email address.');
//       setLoading(false);
//       return;
//     }

//     // Validate password
//     const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     if (!passwordRegex.test(password)) {
//       setError('Password must be at least 8 characters long, contain a number, and a special character.');
//       setLoading(false);
//       return;
//     }

//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       // Store user information in Realtime Database
//       const userRef = ref(database, 'users/' + user.uid);

//       // Capture current timestamp in UTC+5:30
//       const createdAt = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).toISOString().replace('Z', '').slice(0, 19) + '+05:30';

//       await set(userRef, {
//         id: user.uid,
//         name,
//         email,
//         phone,
//         isLoggedIn: false,
//         createdAt // Save the timestamp in UTC+5:30
//       });

//       alert('User registered successfully!');

//       // Clear form fields
//       setName('');
//       setEmail('');
//       setPhone('');
//       setPassword('');

//       navigate('/');
//     } catch (error) {
//       if (error.code === 'auth/email-already-in-use') {
//         setError('This email is already in use. Please use a different email.');
//       } else if (error.code === 'auth/weak-password') {
//         setError('Password should be at least 6 characters.');
//       } else {
//         setError(error.message);
//       }
//       console.error("Error during sign-up:", error);
//     } finally {
//       setLoading(false); // Allow submissions again
//     }
//   };

//   return (
//     <div className="form-container">
//       <h2>Sign Up</h2>
//       <form onSubmit={handleSignup}>
//         <label>Name:</label>
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           required
//         />
//         <br />
//         <label>Email:</label>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <br />
//         <label>Phone:</label>
//         <input
//           type="text"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
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
//         <button type="submit" disabled={loading}>
//           {loading ? 'Signing Up...' : 'Sign Up'}
//         </button>
//       </form>
//       {error && <p className="error-message">{error}</p>}
//     </div>
//   );
// };

// export default Signup;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { TextField, Button, Typography, Box, Grid, Avatar, Alert } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';


const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); // Reset error message
    setLoading(true); // Prevent multiple submissions

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, contain a number, and a special character.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user information in Realtime Database
      const userRef = ref(database, 'users/' + user.uid);

      // Capture current timestamp in UTC+5:30
      const createdAt = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).toISOString().replace('Z', '').slice(0, 19) + '+05:30';

      await set(userRef, {
        id: user.uid,
        name,
        email,
        phone,
        isLoggedIn: false,
        createdAt // Save the timestamp in UTC+5:30
      });

      alert('User registered successfully!');
      
      // Clear form fields after successful registration
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');

      navigate('/');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please use a different email.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(error.message);
      }
      console.error("Error during sign-up:", error);
    } finally {
      setLoading(false); // Allow submissions again
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' }}>
      
  {/* Project Icon in the Top Right Corner */}
  <Box
    component="img"
    src={'icon.png'}
    alt="Project Icon"
    sx={{
      width: 60,
      height: 60,
      position: 'absolute',
      top: '20px',
      left: '20px',
      filter: 'brightness(1.5)',
      borderRadius: '50%', 
      boxShadow: '0 0 15px 5px rgba(255, 255, 255, 0.5)', 
      transition: 'all 0.3s ease', 
      '&:hover': {
      filter: 'brightness(1.7)', 
      boxShadow: '0 0 20px 10px rgba(255, 255, 255, 0.7)',
    },
    }}
  />



    <Grid 
      container 
      justifyContent="center" 
      alignItems="center" 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' // Light Blue Gradient Background
      }}
    >
      <Grid 
        item 
        xs={11} sm={8} md={6} lg={4} xl={3}
        sx={{ 
          padding: { xs: 1, sm: 2 }, 
          boxShadow: { xs: 5, sm: 10 }, 
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 2,
          minHeight: '400px', 
          maxHeight: '700px', 
        }}
      >
        <Box component="form" onSubmit={handleSignup} sx={{ padding: { xs: 0, sm: 1 } }}>
          
          {/* Avatar with Lock Icon */}
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ marginBottom: 2 }}>
          <Avatar sx={{ m: 1, bgcolor: '#64B5F6' }}>
              <PersonAddOutlinedIcon />
            </Avatar>
          </Box>

          <Typography 
            variant="h4" 
            gutterBottom 
            align="center"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' }, // Responsive typography
              marginBottom: { xs: 2, sm: 3 }
            }}
          >
            Sign Up
          </Typography>

          {/* Name Field */}
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{
              marginBottom: { xs: 1, sm: 2 }
            }}
          />

          {/* Email Field */}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              marginBottom: { xs: 1, sm: 2 }
            }}
          />

          {/* Phone Field */}
          <TextField
            label="Phone"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{
              marginBottom: { xs: 1, sm: 2 }
            }}
          />

          {/* Password Field */}
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              marginBottom: { xs: 1, sm: 2 }
            }}
          />

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          {/* Sign Up Button */}
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ 
              marginTop: { xs: 1, sm: 2 },
              padding: { xs: '10px', sm: '15px' } // Responsive padding for button
            }}
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </Box>
      </Grid>
    </Grid>
    </Box>
  );
};

export default Signup;































//################   CODE FOR LOCAL STORAGE    #############


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid'; // For unique user ID

// const Signup = () => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const navigate = useNavigate();

//   const handleSignup = (e) => {
//     e.preventDefault();

//     // Validation checks
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const phoneRegex = /^[0-9]{10}$/;
//     const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//     if (name === '') {
//       alert('Please enter your name');
//       return;
//     }

//     if (!emailRegex.test(email)) {
//       alert('Please enter a valid email address');
//       return;
//     }

//     if (!phoneRegex.test(phone)) {
//       alert('Please enter a valid 10-digit phone number');
//       return;
//     }

//     if (!passwordRegex.test(password)) {
//       alert('Password must be at least 8 characters long, contain a number, and a special character');
//       return;
//     }

//     // Retrieve current users from localStorage
//     const users = JSON.parse(localStorage.getItem('users')) || [];

//     // Check if user already exists
//     const userExists = users.some((user) => user.email === email);

//     if (userExists) {
//       alert('User with this email already exists. Please log in.');
//       navigate('/'); // Redirect to login page
//       return;
//     }

//     // Generate a unique ID for the user
//     const newUser = {
//       id: uuidv4(),
//       name,
//       email,
//       phone,
//       password,
//       isLoggedIn: false
//     };

//     // Add new user to the array of users
//     users.push(newUser);

//     // Store updated users array in localStorage
//     localStorage.setItem('users', JSON.stringify(users));

//     // Redirect to login page
//     alert('User registered successfully!');
//     navigate('/');
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
//         <label>Phone Number:</label>
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
//         <button type="submit">Sign Up</button>
//       </form>
//     </div>
//   );
// };

// export default Signup;












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
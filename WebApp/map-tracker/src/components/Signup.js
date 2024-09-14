import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // For unique user ID

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();

    // Validation checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (name === '') {
      alert('Please enter your name');
      return;
    }

    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!phoneRegex.test(phone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    if (!passwordRegex.test(password)) {
      alert('Password must be at least 8 characters long, contain a number, and a special character');
      return;
    }

    // Retrieve current users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if user already exists
    const userExists = users.some((user) => user.email === email);

    if (userExists) {
      alert('User with this email already exists. Please log in.');
      navigate('/'); // Redirect to login page
      return;
    }

    // Generate a unique ID for the user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      phone,
      password,
      isLoggedIn: false
    };

    // Add new user to the array of users
    users.push(newUser);

    // Store updated users array in localStorage
    localStorage.setItem('users', JSON.stringify(users));

    // Redirect to login page
    alert('User registered successfully!');
    navigate('/');
  };

  return (
    <div className="form-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br />
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <label>Phone Number:</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;

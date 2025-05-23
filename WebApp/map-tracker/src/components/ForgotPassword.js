import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { getDatabase, ref, get, child } from "firebase/database";
import { TextField, Button, Typography, Alert, Box } from "@mui/material";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [linkSent, setLinkSent] = useState(false); // State to manage button visibility
  const navigate = useNavigate(); // Hook to navigate between pages

  const auth = getAuth();
  const database = getDatabase();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      // Check if the email is registered in the Realtime Database
      const snapshot = await get(child(ref(database), "users/"));
      let isRegistered = false;

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === email) {
          isRegistered = true;
        }
      });

      if (!isRegistered) {
        setError("This email is not registered.");
        return;
      }

      // If email is registered, send the password reset email
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent successfully!");
      setLinkSent(true); // Hide send link button after success
    } catch (err) {
      console.error("Error sending reset email:", err.message);
      setError(err.message); // This will give more insight (e.g., user not found)
    }
  };

  return (
    <Box
      sx={{
        padding: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5", // Light gray background
      }}
    >
      <Typography variant="h4" gutterBottom align="center">
        Forgot Password
      </Typography>
      <form onSubmit={handleForgotPassword}>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          required
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#3f51b5", // Primary color
              },
              "&:hover fieldset": {
                borderColor: "#3f51b5", // Hover effect
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3f51b5", // Focus effect
              },
            },
          }}
          disabled={linkSent} // Disable input after sending the link
        />
        {error && (
          <Alert severity="error" sx={{ marginY: 1 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ marginY: 1 }}>
            {success}
          </Alert>
        )}

        {!linkSent ? (
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              marginTop: 2,
              backgroundColor: "#3f51b5", // Primary button color
              "&:hover": {
                backgroundColor: "#303f9f", // Darker shade on hover
              },
            }}
          >
            Send Reset Link
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{
              marginTop: 2,
              backgroundColor: "#f44336", // Red button color
              "&:hover": {
                backgroundColor: "#d32f2f", // Darker red on hover
              },
            }}
            onClick={() => navigate("/")} // Redirect to login page
          >
            Back to Login
          </Button>
        )}
      </form>
    </Box>
  );
};

export default ForgotPassword;

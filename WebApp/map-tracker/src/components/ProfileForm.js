import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { database } from "../firebase"; // Ensure correct import
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ProfileForm = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    aadhar: "",
    license: "",
    dob: "",
    gender: "",
    permanentAddress: "",
    correspondenceAddress: "",
    lightMotorVehicles: "", //new
    lightCommercialVehicles: "",//new
    heavyVehicles: "",//new
    //vehicles: "",
    age: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const [vehicles, setVehicles] = useState([]); // new
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate(); // Initialize useNavigate

  // Fetch existing user data from Firebase Realtime Database
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userProfile = snapshot.val();
            setUserData({
              name: userProfile.name || "",
              email: userProfile.email || "",
              phone: userProfile.phone || "",
              aadhar: userProfile.aadhar || "",
              license: userProfile.license || "",
              dob: userProfile.dob || "",
              gender: userProfile.gender || "",
              permanentAddress: userProfile.permanentAddress || "",
              correspondenceAddress: userProfile.correspondenceAddress || "",
              vehicles: userProfile.vehicles || "",
              age: calculateAge(userProfile.dob) || "",
            });
            setVehicles(userProfile.vehicles || []);
          } else {
            setError("No user data found. Please complete your profile.");
          }
        } catch (error) {
          setError("Error fetching data from Firebase.");
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Calculate age based on the date of birth (DOB)
  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  //Handle vehicles - new
  const handleAddVehicle = () => {
    setVehicles([...vehicles, { type: "", number: "" }]);
  };

  const handleVehicleChange = (index, field, value) => {
    const updatedVehicles = vehicles.map((vehicle, i) =>
      i === index ? { ...vehicle, [field]: value } : vehicle
    );
    setVehicles(updatedVehicles);
  };

  // Handle input changes in the form fields
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only zero or positive values for specific fields
  const fieldsToValidate = ["lightMotorVehicles", "lightCommercialVehicles", "heavyVehicles"];
  
  if (fieldsToValidate.includes(name)) {
    // Ensure the value is zero or positive
    const validatedValue = Math.max(0, Number(value) || 0);
    setUserData({ ...userData, [name]: validatedValue });
    return; // Exit early since validation is complete
  }

    // If the user selects a date of birth (dob), calculate the age
    if (name === "dob") {
      const calculatedAge = calculateAge(value);
      setUserData({ ...userData, dob: value, age: calculatedAge });
    } else {
      setUserData({ ...userData, [name]: value });
    }

    // If checkbox is checked, copy permanent address to correspondence address
    if (sameAddress && name === "permanentAddress") {
      setUserData({
        ...userData,
        permanentAddress: value,
        correspondenceAddress: value,
      });
    }
  };

  // Handle checkbox toggle for same address
  const handleAddressCheckbox = () => {
    setSameAddress(!sameAddress);
    if (!sameAddress) {
      setUserData({
        ...userData,
        correspondenceAddress: userData.permanentAddress,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("User not authenticated.");
      return;
    }

    try {
      const updatedUser = {
        ...userData,
        age: calculateAge(userData.dob), // Recalculate age
        vehicles
      };

      const userRef = ref(database, `users/${user.uid}`);
      await update(userRef, updatedUser);

      setSuccess("Profile updated successfully!");
      setError("");
      console.log("Profile updated in Firebase:", updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
      setSuccess("");
    }
  };

  // Handle navigation to the dashboard
  const handleClose = () => {
    navigate("/dashboard"); // Redirect to dashboard
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          borderRadius: 2,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          width: "100%",
          maxWidth: 600,
          margin: "5%",
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Edit Profile
        </Typography>
        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="success.main" align="center">
            {success}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={userData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={userData.email}
            margin="normal"
            disabled
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Aadhar No."
            name="aadhar"
            value={userData.aadhar}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Driving Licence No."
            name="license"
            value={userData.license}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            name="dob"
            value={userData.dob}
            onChange={handleChange}
            margin="normal"
            required
            InputLabelProps={{
            shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="Age"
            name="age"
            value={userData.age}
            InputProps={{
            readOnly: true,
            }}
            margin="normal"
            disabled
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={userData.gender}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>Select Gender</em>
              </MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Permanent Address"
            name="permanentAddress"
            value={userData.permanentAddress}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={3}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={sameAddress}
                onChange={handleAddressCheckbox}
              />
            }
            label="Same as Permanent Address"
          />
          <TextField
            fullWidth
            label="Correspondence Address"
            name="correspondenceAddress"
            value={userData.correspondenceAddress}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={3}
            disabled={sameAddress}
          />
          {/* <TextField
            fullWidth
            label="Total Vehicles"
            name="vehicles"
            type="number"
            value={userData.vehicles}
            onChange={handleChange}
            margin="normal"
            required
          /> */}
          <Typography variant="h6" sx={{ marginTop: 3 }}>
          Vehicle Details
        </Typography>
        {vehicles.map((vehicle, index) => (
          <Box key={index} sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={vehicle.type}
                onChange={(e) =>
                  handleVehicleChange(index, "type", e.target.value)
                }
              >
                <MenuItem value="LMV">LMV</MenuItem>
                <MenuItem value="LMV-TR">LMV-TR</MenuItem>
                <MenuItem value="TRANS">TRANS</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Vehicle Number"
              value={vehicle.number}
              onChange={(e) =>
                handleVehicleChange(index, "number", e.target.value)
              }
              required
            />
          </Box>
        ))}
        <Button
          type="button"
          variant="outlined"
          onClick={handleAddVehicle}
          sx={{ marginBottom: 2 }}
        >
          Add Vehicle
        </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: 2 }}
          >
            Update Profile
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ marginTop: 2 }}
            onClick={handleClose}
          >
            Close
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ProfileForm;

/* Three Fields withpout the add functionality.
<Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2, // Add spacing between the fields
            }}
          >
            <TextField
              fullWidth
              label="LMV"
              name="lightMotorVehicles"
              type="number"
              value={userData.lightMotorVehicles}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="LMV-TR"
              name="lightCommercialVehicles"
              type="number"
              value={userData.lightCommercialVehicles}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="TRANS"
              name="heavyVehicles"
              type="number"
              value={userData.heavyVehicles}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Box>
*/
//######## BEFORE STYLING ##########

// // src/components/ProfileForm.js
// import React, { useState, useEffect } from "react";
// import { getAuth } from "firebase/auth";
// import { ref, get, set, update } from "firebase/database";
// import { database } from "../firebase"; // Ensure correct import

// const ProfileForm = () => {
//   const [userData, setUserData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     aadhar: "",
//     license: "",
//     dob: "",
//     gender: "",
//     permanentAddress: "",
//     correspondenceAddress: "",
//     vehicles: "",
//     age: "",
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [sameAddress, setSameAddress] = useState(false);

//   const auth = getAuth();
//   const user = auth.currentUser;

//   // Fetch existing user data from Firebase Realtime Database
//   useEffect(() => {
//     const fetchData = async () => {
//       if (user) {
//         try {
//           const userRef = ref(database, `users/${user.uid}`);
//           const snapshot = await get(userRef);
//           if (snapshot.exists()) {
//             const userProfile = snapshot.val();
//             setUserData({
//               name: userProfile.name || "",
//               email: userProfile.email || "",
//               phone: userProfile.phone || "",
//               aadhar: userProfile.aadhar || "",
//               license: userProfile.license || "",
//               dob: userProfile.dob || "",
//               gender: userProfile.gender || "",
//               permanentAddress: userProfile.permanentAddress || "",
//               correspondenceAddress: userProfile.correspondenceAddress || "",
//               vehicles: userProfile.vehicles || "",
//               age: calculateAge(userProfile.dob) || "",
//             });
//           } else {
//             setError("No user data found. Please complete your profile.");
//           }
//         } catch (error) {
//           setError("Error fetching data from Firebase.");
//         }
//       }
//       setLoading(false);
//     };

//     fetchData();
//   }, [user]);

//   // Validate Aadhar (12 digits) and License number format
//   const validateFields = () => {
//     const aadharPattern = /^\d{12}$/; // 12 digits
//     const licensePattern = /^[A-Z]{2}\d{2} \d{11}$/; // Sample pattern for Indian license numbers

//     if (!aadharPattern.test(userData.aadhar)) {
//       setError("Invalid Aadhar number. It should be 12 digits.");
//       return false;
//     }

//     if (!licensePattern.test(userData.license)) {
//       setError("Invalid Driving License number format.");
//       return false;
//     }

//     // Clear any error if validation passes
//     setError("");
//     return true;
//   };

//   // Handle input changes in the form fields
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     // If the user selects a date of birth (dob), calculate the age
//     if (name === "dob") {
//       const calculatedAge = calculateAge(value);
//       setUserData({ ...userData, dob: value, age: calculatedAge });
//     } else {
//       setUserData({ ...userData, [name]: value });
//     }

//     // If checkbox is checked, copy permanent address to correspondence address
//     if (sameAddress && name === "permanentAddress") {
//       setUserData({
//         ...userData,
//         permanentAddress: value,
//         correspondenceAddress: value,
//       });
//     }
//   };

//   // Handle checkbox toggle for same address
//   const handleAddressCheckbox = () => {
//     setSameAddress(!sameAddress);
//     if (!sameAddress) {
//       setUserData({
//         ...userData,
//         correspondenceAddress: userData.permanentAddress,
//       });
//     }
//   };

//   // Calculate age based on the date of birth (DOB)
//   const calculateAge = (dob) => {
//     if (!dob) return "";
//     const birthDate = new Date(dob);
//     const currentDate = new Date();
//     let age = currentDate.getFullYear() - birthDate.getFullYear();
//     const monthDiff = currentDate.getMonth() - birthDate.getMonth();
//     if (
//       monthDiff < 0 ||
//       (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
//     ) {
//       age--;
//     }
//     return age;
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate fields before attempting to update
//     if (!validateFields()) {
//       return;
//     }

//     if (!user) {
//       setError("User not authenticated.");
//       return;
//     }

//     try {
//       const updatedUser = {
//         ...userData,
//         age: calculateAge(userData.dob), // Recalculate age
//       };

//       const userRef = ref(database, `users/${user.uid}`);
//       await update(userRef, updatedUser);

//       // Provide success feedback and reset the error
//       setSuccess("Profile updated successfully!");
//       setError("");
//       console.log("Profile updated in Firebase:", updatedUser);
//     } catch (error) {
//       // Log error and provide user feedback
//       console.error("Error updating profile:", error);
//       setError("Failed to update profile. Please try again.");
//       setSuccess(""); // Clear success message if there is an error
//     }
//   };

//   if (loading) {
//     return <p>Loading profile...</p>;
//   }

//   return (
//     <div className="profile-form-container">
//       <h3>Edit Profile</h3>
//       {error && <p className="error-message">{error}</p>}
//       {success && <p className="success-message">{success}</p>}

//       <form onSubmit={handleSubmit}>
//         <label>Name:</label>
//         <input
//           type="text"
//           name="name"
//           value={userData.name}
//           onChange={handleChange}
//           onFocus={() => setSuccess("")} // Clear success message on focus
//           required
//         />
//         {/* Unchangeable Fields */}
//         <label>Email:</label>
//         <input type="email" name="email" value={userData.email} disabled />

//         {/* Modifiable Fields */}
//         <div>
//           <label>Phone:</label>
//           <input
//             type="text"
//             name="phone"
//             value={userData.phone}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")} // Clear success message on focus
//             required
//           />
//         </div>

//         <div>
//           <label>Aadhar No.:</label>
//           <input
//             type="text"
//             name="aadhar"
//             value={userData.aadhar}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")} // Clear success message on focus
//             required
//           />

//           <label>Driving Licence No.:</label>
//           <input
//             type="text"
//             name="license"
//             value={userData.license}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")} // Clear success message on focus
//             required
//           />
//         </div>

//         <div>
//           <label>Date of Birth:</label>
//           <input
//             type="date"
//             name="dob"
//             value={userData.dob}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")} // Clear success message on focus
//             required
//           />

//           {/* Age - auto-calculated and non-editable */}
//           <label>Age:</label>
//           <input
//             type="text"
//             name="age"
//             value={userData.age}
//             readOnly
//             disabled
//           />

//           <label>Gender:</label>
//           <select
//             name="gender"
//             value={userData.gender}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")}
//             required
//           >
//             <option value="">Select Gender</option>
//             <option value="male">Male</option>
//             <option value="female">Female</option>
//             <option value="other">Other</option>
//           </select>
//         </div>

//         <div>
//           <label>Permanent Address:</label>
//           <textarea
//             name="permanentAddress"
//             value={userData.permanentAddress}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")} // Clear success message on focus
//             required
//           />
//           <label>
//             <input
//               type="checkbox"
//               checked={sameAddress}
//               onChange={handleAddressCheckbox}
//             />
//             Same as Permanent Address
//           </label>
//           <label>Correspondence Address:</label>
//           <textarea
//             name="correspondenceAddress"
//             value={userData.correspondenceAddress}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")} // Clear success message on focus
//             required
//             disabled={sameAddress} // Disable if checkbox is checked
//           />
//         </div>

//         <div>
//           <label>Total Vehicles:</label>
//           <input
//             type="number"
//             name="vehicles"
//             value={userData.vehicles}
//             onChange={handleChange}
//             onFocus={() => setSuccess("")} // Clear success message on focus
//             required
//           />
//         </div>

//         <div>
//           <button type="submit">Update Profile</button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ProfileForm;

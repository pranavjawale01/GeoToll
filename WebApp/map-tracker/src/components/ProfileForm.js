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
import Map from "./AddressMap"; // Added for address-map
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
    permanentLatitude: 0,
    permanentLongitude: 0,
    correspondenceAddress: "",
    correspondenceLatitude: 0,
    correspondenceLongitude: 0,
    lightMotorVehicles: "",
    lightCommercialVehicles: "",
    heavyVehicles: "",
    age: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  //const [vehicles, setVehicles] = useState([]);
  const [vehicles, setVehicles] = useState({});
  //const [isMapOpen, setIsMapOpen] = useState(false); // To control map modal visibility-new
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate(); // Initialize useNavigate
  const [isPermanentMapOpen, setIsPermanentMapOpen] = useState(false);
  const [isCorrespondenceMapOpen, setIsCorrespondenceMapOpen] = useState(false);

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
              permanentLatitude: userProfile.permanentLatitude || "",
              permanentLongitude: userProfile.permanentLongitude || "",
              correspondenceAddress: userProfile.correspondenceAddress || "",
              correspondenceLatitude: userProfile.correspondenceLatitude || "",
              correspondenceLongitude:
                userProfile.correspondenceLongitude || "",
              age: calculateAge(userProfile.dob) || "",
            });
            setVehicles(userProfile.vehicles || {});
          } else {
            setError("No user data found. Please complete your profile.");
          }
        } catch (error) {
          console.error("Error fetching data:", error);
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

  // Handle input changes in the form fields
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only zero or positive values for specific fields
    const fieldsToValidate = [
      "lightMotorVehicles",
      "lightCommercialVehicles",
      "heavyVehicles",
    ];

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

  const handleAddressCheckbox = (event) => {
    const checked = event.target.checked;
    setSameAddress(checked);

    if (checked) {
      setUserData((prev) => ({
        ...prev,
        correspondenceAddress: prev.permanentAddress,
        correspondenceLatitude: prev.permanentLatitude,
        correspondenceLongitude: prev.permanentLongitude,
      }));
    } else {
      setUserData((prev) => ({
        ...prev,
        correspondenceAddress: "",
        correspondenceLatitude: "",
        correspondenceLongitude: "",
      }));
    }
  };

  const handlePermanentLocationSelect = async (lat, lng) => {
    setUserData((prev) => ({
      ...prev,
      permanentLatitude: lat,
      permanentLongitude: lng,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      setUserData((prev) => ({
        ...prev,
        permanentAddress: data?.display_name || "Address not found",
      }));
    } catch (error) {
      console.error("Error fetching address:", error);
      setUserData((prev) => ({
        ...prev,
        permanentAddress: "Failed to fetch address",
      }));
    }

    setIsPermanentMapOpen(false);
  };

  const handleCorrespondenceLocationSelect = async (lat, lng) => {
    setUserData((prev) => ({
      ...prev,
      correspondenceLatitude: lat,
      correspondenceLongitude: lng,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      setUserData((prev) => ({
        ...prev,
        correspondenceAddress: data?.display_name || "Address not found",
      }));
    } catch (error) {
      console.error("Error fetching address:", error);
      setUserData((prev) => ({
        ...prev,
        correspondenceAddress: "Failed to fetch address",
      }));
    }

    setIsCorrespondenceMapOpen(false);
  };

  // Add a new empty vehicle with default type and number
  const handleAddVehicle = () => {
    setVehicles({
      ...vehicles,
      [""]: { type: "" }, // Empty key initially
    });
  };

  // Handle change of vehicle details
  const handleVehicleChange = (vehicleNumber, field, value) => {
    // If the vehicle number changes, update key
    if (field === "number") {
      const updatedVehicles = { ...vehicles };
      updatedVehicles[value] = {
        ...vehicles[vehicleNumber],
        type: vehicles[vehicleNumber]?.type || "",
        number: value,
      };
      delete updatedVehicles[vehicleNumber]; // Remove old key
      setVehicles(updatedVehicles);
    } else {
      // Update vehicle type
      setVehicles({
        ...vehicles,
        [vehicleNumber]: {
          ...vehicles[vehicleNumber],
          [field]: value,
          number: vehicleNumber,
        },
      });
    }
  };

  // Handle delete last vehicle
  const handleDeleteVehicle = () => {
    const vehicleKeys = Object.keys(vehicles);
    if (vehicleKeys.length > 0) {
      const lastKey = vehicleKeys[vehicleKeys.length - 1];
      const updatedVehicles = { ...vehicles };
      delete updatedVehicles[lastKey];
      setVehicles(updatedVehicles);
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
        vehicles,
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

          <Typography sx={{ marginTop: 1, marginBottom: 1 }}>
            Permanent Address
          </Typography>

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

          <TextField
            fullWidth
            label="Permanent Address Latitude"
            name="permanentLatitude"
            value={userData.permanentLatitude}
            margin="normal"
            required
            disabled
          />

          <TextField
            fullWidth
            label="Permanent Address Longitude"
            name="permanentLongitude"
            value={userData.permanentLongitude}
            margin="normal"
            required
            disabled
          />

          <Button
            type="button"
            variant="outlined"
            onClick={() => setIsPermanentMapOpen(true)}
          >
            Select Permanent Address on Map
          </Button>

          {isPermanentMapOpen && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  marginTop: 10,
                  marginLeft: 20,
                  backgroundColor: "black",
                  padding: 2,
                  zIndex: 1000,
                  borderRadius: 2,
                  boxShadow: 3,
                  width: "90vw",
                  height: "90vw",
                  maxWidth: "500px",
                  maxHeight: "500px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Map
                  onLocationSelect={handlePermanentLocationSelect}
                  sx={{ width: "100%", height: "100%" }}
                />
                <Button
                  variant="outlined"
                  onClick={() => setIsPermanentMapOpen(false)}
                  sx={{ marginTop: 2 }}
                >
                  Close Map
                </Button>
              </Box>
            </Box>
          )}

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

          <TextField
            fullWidth
            label="Correspondence Address Latitude"
            name="correspondenceLatitude"
            value={userData.correspondenceLatitude}
            margin="normal"
            required
            disabled
          />

          <TextField
            fullWidth
            label="Correspondence Address Longitude"
            name="correspondenceLongitude"
            value={userData.correspondenceLongitude}
            margin="normal"
            required
            disabled
          />
          <Button
            type="button"
            variant="outlined"
            onClick={() => setIsCorrespondenceMapOpen(true)}
            disabled={sameAddress} // Disable when copying permanent address
          >
            Select Correspondence Address on Map
          </Button>

          {isCorrespondenceMapOpen && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  marginTop: 10,
                  marginLeft: 20,
                  backgroundColor: "black",
                  padding: 2,
                  zIndex: 1000,
                  borderRadius: 2,
                  boxShadow: 3,
                  width: "90vw",
                  height: "90vw",
                  maxWidth: "500px",
                  maxHeight: "500px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Map
                  onLocationSelect={handleCorrespondenceLocationSelect}
                  sx={{ width: "100%", height: "100%" }}
                />
                <Button
                  variant="outlined"
                  onClick={() => setIsCorrespondenceMapOpen(false)}
                  sx={{ marginTop: 2 }}
                >
                  Close Map
                </Button>
              </Box>
            </Box>
          )}

          <Box>
            <Typography sx={{ marginTop: 1, marginBottom: 1 }}>
              Vehicle Details
            </Typography>

            {/* Map through vehicles object and render inputs */}
            {Object.entries(vehicles).map(([vehicleNumber, vehicle], index) => (
              <Box
                key={index}
                sx={{ display: "flex", gap: 2, marginBottom: 2 }}
              >
                {/* Vehicle Type */}
                <FormControl fullWidth required>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={vehicle.type}
                    onChange={(e) =>
                      handleVehicleChange(vehicleNumber, "type", e.target.value)
                    }
                  >
                    <MenuItem value="LMV">LMV</MenuItem>
                    <MenuItem value="LMV-TR">LMV-TR</MenuItem>
                    <MenuItem value="TRANS">TRANS</MenuItem>
                  </Select>
                </FormControl>

                {/* Vehicle Number */}
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  value={vehicleNumber}
                  onChange={(e) =>
                    handleVehicleChange(vehicleNumber, "number", e.target.value)
                  }
                  required
                />
              </Box>
            ))}

            {/* Add Vehicle Button */}
            <Button
              type="button"
              variant="outlined"
              onClick={handleAddVehicle}
              sx={{ marginBottom: 2 }}
            >
              Add Vehicle
            </Button>

            {/* Delete Last Vehicle Button */}
            <Button
              type="button"
              variant="outlined"
              onClick={handleDeleteVehicle}
              sx={{ marginBottom: 2, marginLeft: 2 }}
              disabled={Object.keys(vehicles).length === 0}
            >
              Delete Last Vehicle
            </Button>
          </Box>

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
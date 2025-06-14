// Improvd profileform
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { database } from "../firebase";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";

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
    lightMotorVehicles: "",
    lightCommercialVehicles: "",
    heavyVehicles: "",
    age: "",
    walletBalance: "",
    permanentAddressData: {
      latitude: "",
      longitude: "",
      permanentAddress: "",
    },
    residentialAddressData: {
      latitude: "",
      longitude: "",
      residentialAddress: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const [vehicles, setVehicles] = useState({});
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate(); // Initialize useNavigate
  const [isPermanentMapOpen, setIsPermanentMapOpen] = useState(false);
  const [isCorrespondenceMapOpen, setIsCorrespondenceMapOpen] = useState(false);
  const [walletError, setWalletError] = useState(""); //12/04/25

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
              age: calculateAge(userProfile.dob) || "",
              walletBalance: userProfile.walletBalance || "",
              permanentAddressData: {
                latitude: userProfile.permanentAddressData?.latitude || "",
                longitude: userProfile.permanentAddressData?.longitude || "",
                permanentAddress:
                  userProfile.permanentAddressData?.permanentAddress || "",
              },
              residentialAddressData: {
                latitude: userProfile.residentialAddressData?.latitude || "",
                longitude: userProfile.residentialAddressData?.longitude || "",
                residentialAddress:
                  userProfile.residentialAddressData?.residentialAddress || "",
              },
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only zero or positive values for specific fields
    const fieldsToValidate = [
      "lightMotorVehicles",
      "lightCommercialVehicles",
      "heavyVehicles",
    ];

    if (fieldsToValidate.includes(name)) {
      const validatedValue = Math.max(0, Number(value) || 0);
      setUserData({ ...userData, [name]: validatedValue });
      return;
    }

    // Wallet balance validation
    if (name === "walletBalance") {
      const numericValue = parseFloat(value);
      if (numericValue < 500) {
        setWalletError("Minimum wallet balance should be ₹500");
      } else {
        setWalletError("");
      }
      setUserData((prevState) => ({
        ...prevState,
        [name]: numericValue,
      }));
      return;
    }

    // Calculate age from DOB
    if (name === "dob") {
      const calculatedAge = calculateAge(value);
      setUserData({ ...userData, dob: value, age: calculatedAge });
      return;
    }

    // Copy permanent to correspondence address if checkbox is checked
    if (sameAddress && name === "permanentAddress") {
      setUserData({
        ...userData,
        permanentAddress: value,
        correspondenceAddress: value,
      });
      return;
    }

    // Handle nested address fields (permanent/residential)
    if (
      name.startsWith("permanentAddressData.") ||
      name.startsWith("residentialAddressData.")
    ) {
      const [parent, child] = name.split(".");
      setUserData((prevState) => ({
        ...prevState,
        [parent]: {
          ...prevState[parent],
          [child]: value,
        },
      }));
      return;
    }

    // Default update for all other fields
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddressCheckbox = (event) => {
    const checked = event.target.checked;
    setSameAddress(checked);

    if (checked) {
      setUserData((prev) => ({
        ...prev,
        residentialAddressData: {
          residentialAddress: prev.permanentAddressData.permanentAddress,
          latitude: prev.permanentAddressData.latitude,
          longitude: prev.permanentAddressData.longitude,
        },
      }));
    } else {
      setUserData((prev) => ({
        ...prev,
        residentialAddressData: {
          residentialAddress: "",
          latitude: "",
          longitude: "",
        },
      }));
    }
  };

  const handlePermanentLocationSelect = async (lat, lng) => {
    // First, update lat/lng
    setUserData((prev) => ({
      ...prev,
      permanentAddressData: {
        ...prev.permanentAddressData,
        latitude: lat,
        longitude: lng,
      },
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      setUserData((prev) => ({
        ...prev,
        permanentAddressData: {
          ...prev.permanentAddressData,
          permanentAddress: data?.display_name || "Address not found",
        },
      }));
    } catch (error) {
      console.error("Error fetching address:", error);
      setUserData((prev) => ({
        ...prev,
        permanentAddressData: {
          ...prev.permanentAddressData,
          permanentAddress: "Failed to fetch address",
        },
      }));
    }

    setIsPermanentMapOpen(false);
  };

  const handleCorrespondenceLocationSelect = async (lat, lng) => {
    // First, update lat/lng
    setUserData((prev) => ({
      ...prev,
      residentialAddressData: {
        ...prev.residentialAddressData,
        latitude: lat,
        longitude: lng,
      },
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      setUserData((prev) => ({
        ...prev,
        residentialAddressData: {
          ...prev.residentialAddressData,
          residentialAddress: data?.display_name || "Address not found",
        },
      }));
    } catch (error) {
      console.error("Error fetching address:", error);
      setUserData((prev) => ({
        ...prev,
        residentialAddressData: {
          ...prev.residentialAddressData,
          residentialAddress: "Failed to fetch address",
        },
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

  const handleDeleteVehicleByKey = (vehicleNumber) => {
    setVehicles((prev) => {
      const updated = { ...prev };
      delete updated[vehicleNumber];
      return updated;
    });
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
        background: "linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)",
        padding: 2,
      }}
    >
      <Paper
        elevation={5}
        sx={{
          padding: 4,
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          width: "100%",
          maxWidth: 800,
          boxShadow: 5,
          margin: "auto",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{ marginBottom: 3, marginTop: 3 }}
        >
          Edit Profile
        </Typography>

        {error && (
          <Typography color="error" align="center" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography
            color="success.main"
            align="center"
            sx={{ marginBottom: 2 }}
          >
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
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={userData.email}
            margin="normal"
            disabled
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            margin="normal"
            required
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Aadhar No."
            name="aadhar"
            value={userData.aadhar}
            onChange={handleChange}
            margin="normal"
            required
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Driving Licence No."
            name="license"
            value={userData.license}
            onChange={handleChange}
            margin="normal"
            required
            sx={{ marginBottom: 2 }}
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
            sx={{ marginBottom: 2 }}
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
            sx={{ marginBottom: 2 }}
          />
          <FormControl
            fullWidth
            margin="normal"
            required
            sx={{ marginBottom: 2 }}
          >
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={userData.gender}
              onChange={handleChange}
              sx={{ backgroundColor: "white" }}
            >
              <MenuItem value="">
                <em>Select Gender</em>
              </MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 1 }}>
            Permanent Address
          </Typography>

          <TextField
            fullWidth
            label="Permanent Address"
            name="permanentAddressData.address"
            value={userData.permanentAddressData.permanentAddress}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={3}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Permanent Address Latitude"
            name="permanentAddressData.latitude"
            value={userData.permanentAddressData.latitude}
            margin="normal"
            required
            disabled
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Permanent Address Longitude"
            name="permanentAddressData.longitude"
            value={userData.permanentAddressData.longitude}
            margin="normal"
            required
            disabled
            sx={{ marginBottom: 2 }}
          />

          <Button
            type="button"
            variant="outlined"
            onClick={() => setIsPermanentMapOpen(true)}
            sx={{
              width: "100%",
              marginBottom: 2,
              padding: "10px 0",
              fontSize: "1rem",
              fontWeight: "bold",
              background: "#4caf50",
              color: "white",
              "&:hover": {
                backgroundColor: "#388e3c",
              },
            }}
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
                  sx={{
                    marginTop: 2,
                    color: "white",
                    backgroundColor: "red",
                    "&:hover": {
                      backgroundColor: "#d32f2f",
                    },
                  }}
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
            sx={{ marginBottom: 2 }}
          />

          <TextField
            fullWidth
            label="Correspondence Address"
            name="residentialAddressData.address"
            value={userData.residentialAddressData.residentialAddress}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={3}
            disabled={sameAddress}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Correspondence Address Latitude"
            name="residentialAddressData.latitude"
            value={userData.residentialAddressData.latitude}
            margin="normal"
            required
            disabled
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Correspondence Address Longitude"
            name="residentialAddressData.longitude"
            value={userData.residentialAddressData.longitude}
            margin="normal"
            required
            disabled
            sx={{ marginBottom: 2 }}
          />

          <Button
            type="button"
            variant="outlined"
            onClick={() => setIsCorrespondenceMapOpen(true)}
            disabled={sameAddress}
            sx={{
              width: "100%",
              marginBottom: 2,
              padding: "10px 0",
              fontSize: "1rem",
              fontWeight: "bold",
              background: "#4caf50",
              color: "white",
              "&:hover": {
                backgroundColor: "#388e3c",
              },
            }}
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
                  sx={{
                    marginTop: 2,
                    color: "white",
                    backgroundColor: "red",
                    "&:hover": {
                      backgroundColor: "#d32f2f",
                    },
                  }}
                >
                  Close Map
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ marginTop: 3 }}>
            <Typography variant="h6" sx={{ marginBottom: 1 }}>
              Vehicle Details
            </Typography>

            {Object.entries(vehicles).map(([vehicleNumber, vehicle], index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 2,
                  marginBottom: 2,
                  padding: "10px",
                  borderRadius: 2,
                  backgroundColor: "#f5f5f5",
                  boxShadow: 2,
                }}
              >
                <FormControl fullWidth required>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={vehicle.type}
                    onChange={(e) =>
                      handleVehicleChange(vehicleNumber, "type", e.target.value)
                    }
                    sx={{ backgroundColor: "white" }}
                  >
                    <MenuItem value="LMV">LMV</MenuItem>
                    <MenuItem value="LMV-TR">LMV-TR</MenuItem>
                    <MenuItem value="TRANS">TRANS</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Vehicle Number"
                  value={vehicleNumber}
                  onChange={(e) =>
                    handleVehicleChange(vehicleNumber, "number", e.target.value)
                  }
                  required
                  sx={{ marginBottom: 2 }}
                />

                <IconButton
                  aria-label="delete"
                  color="error"
                  onClick={() => handleDeleteVehicleByKey(vehicleNumber)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              type="button"
              variant="outlined"
              onClick={handleAddVehicle}
              sx={{
                width: "100%",
                marginBottom: 2,
                padding: "10px 0",
                fontSize: "1rem",
                fontWeight: "bold",
                background: "#4caf50",
                color: "white",
                "&:hover": {
                  backgroundColor: "#388e3c",
                },
              }}
            >
              Add Vehicle
            </Button>
          </Box>

          <Typography sx={{ marginTop: 2, marginBottom: 1 }}>
            Wallet Balance
          </Typography>

          <TextField
            fullWidth
            label="Wallet Balance"
            name="walletBalance"
            type="number"
            value={userData.walletBalance}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ min: 0 }}
            error={!!walletError}
            helperText={walletError}
            sx={{ marginBottom: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: 2 }}
            disabled={!!walletError}
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
            Cancel
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ProfileForm;

// // Profile Form

// import React, { useState, useEffect } from "react";
// import { getAuth } from "firebase/auth";
// import { ref, get, update } from "firebase/database";
// import { database } from "../firebase";
// import DeleteIcon from '@mui/icons-material/Delete';
// import IconButton from '@mui/material/IconButton';

// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
//   Paper,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Checkbox,
//   FormControlLabel,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom"; // Import useNavigate
// import Map from "./AddressMap"; // Added for address-map
// const ProfileForm = () => {
//   const [userData, setUserData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     aadhar: "",
//     license: "",
//     dob: "",
//     gender: "",
//     lightMotorVehicles: "",
//     lightCommercialVehicles: "",
//     heavyVehicles: "",
//     age: "",
//     walletBalance: "",
//     permanentAddressData: {
//       latitude: "",
//       longitude: "",
//       permanentAddress: "",
//     },
//     residentialAddressData: {
//       latitude: "",
//       longitude: "",
//       residentialAddress: "",
//     },
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [sameAddress, setSameAddress] = useState(false);
//   const [vehicles, setVehicles] = useState({});
//   const auth = getAuth();
//   const user = auth.currentUser;
//   const navigate = useNavigate(); // Initialize useNavigate
//   const [isPermanentMapOpen, setIsPermanentMapOpen] = useState(false);
//   const [isCorrespondenceMapOpen, setIsCorrespondenceMapOpen] = useState(false);
//   const [walletError, setWalletError] = useState("");//12/04/25

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
//               age: calculateAge(userProfile.dob) || "",
//               walletBalance: userProfile.walletBalance || "",
//               permanentAddressData: {
//                 latitude: userProfile.permanentAddressData?.latitude || "",
//                 longitude: userProfile.permanentAddressData?.longitude || "",
//                 permanentAddress: userProfile.permanentAddressData?.permanentAddress || "",
//               },
//               residentialAddressData: {
//                 latitude: userProfile.residentialAddressData?.latitude || "",
//                 longitude: userProfile.residentialAddressData?.longitude || "",
//                 residentialAddress: userProfile.residentialAddressData?.residentialAddress || "",
//               },
//             });
//             setVehicles(userProfile.vehicles || {});
//           } else {
//             setError("No user data found. Please complete your profile.");
//           }
//         } catch (error) {
//           console.error("Error fetching data:", error);
//           setError("Error fetching data from Firebase.");
//         }
//       }
//       setLoading(false);
//     };

//     fetchData();
//   }, [user]);

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

//   // Handle input changes in the form fields
//   // const handleChange = (e) => {
//   //   const { name, value } = e.target;

//   //   // Allow only zero or positive values for specific fields
//   //   const fieldsToValidate = [
//   //     "lightMotorVehicles",
//   //     "lightCommercialVehicles",
//   //     "heavyVehicles",
//   //   ];

//   //   if (fieldsToValidate.includes(name)) {
//   //     // Ensure the value is zero or positive
//   //     const validatedValue = Math.max(0, Number(value) || 0);
//   //     setUserData({ ...userData, [name]: validatedValue });
//   //     return; // Exit early since validation is complete
//   //   }

//   //   // If the user selects a date of birth (dob), calculate the age
//   //   if (name === "dob") {
//   //     const calculatedAge = calculateAge(value);
//   //     setUserData({ ...userData, dob: value, age: calculatedAge });
//   //   } else {
//   //     setUserData({ ...userData, [name]: value });
//   //   }

//   //   // If checkbox is checked, copy permanent address to correspondence address
//   //   if (sameAddress && name === "permanentAddress") {
//   //     setUserData({
//   //       ...userData,
//   //       permanentAddress: value,
//   //       correspondenceAddress: value,
//   //     });
//   //   }

//   //   //06-04-25
//   //   if (name.startsWith("permanentAddressData.") || name.startsWith("residentialAddressData.")) {
//   //     const [parent, child] = name.split(".");
//   //     setUserData((prevState) => ({
//   //       ...prevState,
//   //       [parent]: {
//   //         ...prevState[parent],
//   //         [child]: value,
//   //       },
//   //     }));
//   //   } else {
//   //     setUserData((prevState) => ({
//   //       ...prevState,
//   //       [name]: value,
//   //     }));
//   //   }
//   // };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     // Allow only zero or positive values for specific fields
//     const fieldsToValidate = [
//       "lightMotorVehicles",
//       "lightCommercialVehicles",
//       "heavyVehicles",
//     ];

//     if (fieldsToValidate.includes(name)) {
//       const validatedValue = Math.max(0, Number(value) || 0);
//       setUserData({ ...userData, [name]: validatedValue });
//       return;
//     }

//     // Wallet balance validation
//     if (name === "walletBalance") {
//       const numericValue = parseFloat(value);
//       if (numericValue < 500) {
//         setWalletError("Minimum wallet balance should be ₹500");
//       } else {
//         setWalletError("");
//       }
//       setUserData((prevState) => ({
//         ...prevState,
//         [name]: numericValue,
//       }));
//       return;
//     }

//     // Calculate age from DOB
//     if (name === "dob") {
//       const calculatedAge = calculateAge(value);
//       setUserData({ ...userData, dob: value, age: calculatedAge });
//       return;
//     }

//     // Copy permanent to correspondence address if checkbox is checked
//     if (sameAddress && name === "permanentAddress") {
//       setUserData({
//         ...userData,
//         permanentAddress: value,
//         correspondenceAddress: value,
//       });
//       return;
//     }

//     // Handle nested address fields (permanent/residential)
//     if (name.startsWith("permanentAddressData.") || name.startsWith("residentialAddressData.")) {
//       const [parent, child] = name.split(".");
//       setUserData((prevState) => ({
//         ...prevState,
//         [parent]: {
//           ...prevState[parent],
//           [child]: value,
//         },
//       }));
//       return;
//     }

//     // Default update for all other fields
//     setUserData((prevState) => ({
//       ...prevState,
//       [name]: value,
//     }));
//   };

//   const handleAddressCheckbox = (event) => {
//     const checked = event.target.checked;
//     setSameAddress(checked);

//     if (checked) {
//       setUserData((prev) => ({
//         ...prev,
//         residentialAddressData: {
//           residentialAddress: prev.permanentAddressData.permanentAddress,
//           latitude: prev.permanentAddressData.latitude,
//           longitude: prev.permanentAddressData.longitude,
//         },
//       }));
//     } else {
//       setUserData((prev) => ({
//         ...prev,
//         residentialAddressData: {
//           residentialAddress: "",
//           latitude: "",
//           longitude: "",
//         },
//       }));
//     }
//   };

//   const handlePermanentLocationSelect = async (lat, lng) => {
//     // First, update lat/lng
//     setUserData((prev) => ({
//       ...prev,
//       permanentAddressData: {
//         ...prev.permanentAddressData,
//         latitude: lat,
//         longitude: lng,
//       },
//     }));

//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
//       );
//       const data = await response.json();

//       setUserData((prev) => ({
//         ...prev,
//         permanentAddressData: {
//           ...prev.permanentAddressData,
//           permanentAddress: data?.display_name || "Address not found",
//         },
//       }));
//     } catch (error) {
//       console.error("Error fetching address:", error);
//       setUserData((prev) => ({
//         ...prev,
//         permanentAddressData: {
//           ...prev.permanentAddressData,
//           permanentAddress: "Failed to fetch address",
//         },
//       }));
//     }

//     setIsPermanentMapOpen(false);
//   };

//   const handleCorrespondenceLocationSelect = async (lat, lng) => {
//     // First, update lat/lng
//     setUserData((prev) => ({
//       ...prev,
//       residentialAddressData: {
//         ...prev.residentialAddressData,
//         latitude: lat,
//         longitude: lng,
//       },
//     }));

//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
//       );
//       const data = await response.json();

//       setUserData((prev) => ({
//         ...prev,
//         residentialAddressData: {
//           ...prev.residentialAddressData,
//           residentialAddress: data?.display_name || "Address not found",
//         },
//       }));
//     } catch (error) {
//       console.error("Error fetching address:", error);
//       setUserData((prev) => ({
//         ...prev,
//         residentialAddressData: {
//           ...prev.residentialAddressData,
//           residentialAddress: "Failed to fetch address",
//         },
//       }));
//     }

//     setIsCorrespondenceMapOpen(false);
//   };

//   // Add a new empty vehicle with default type and number
//   const handleAddVehicle = () => {
//     setVehicles({
//       ...vehicles,
//       [""]: { type: "" }, // Empty key initially
//     });
//   };

//   // Handle change of vehicle details
//   const handleVehicleChange = (vehicleNumber, field, value) => {
//     // If the vehicle number changes, update key
//     if (field === "number") {
//       const updatedVehicles = { ...vehicles };
//       updatedVehicles[value] = {
//         ...vehicles[vehicleNumber],
//         type: vehicles[vehicleNumber]?.type || "",
//         number: value,
//       };
//       delete updatedVehicles[vehicleNumber]; // Remove old key
//       setVehicles(updatedVehicles);
//     } else {
//       // Update vehicle type
//       setVehicles({
//         ...vehicles,
//         [vehicleNumber]: {
//           ...vehicles[vehicleNumber],
//           [field]: value,
//           number: vehicleNumber,
//         },
//       });
//     }
//   };

//   const handleDeleteVehicleByKey = (vehicleNumber) => {
//     setVehicles((prev) => {
//       const updated = { ...prev };
//       delete updated[vehicleNumber];
//       return updated;
//     });
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!user) {
//       setError("User not authenticated.");
//       return;
//     }

//     try {
//       const updatedUser = {
//         ...userData,
//         age: calculateAge(userData.dob), // Recalculate age
//         vehicles,
//       };

//       const userRef = ref(database, `users/${user.uid}`);
//       await update(userRef, updatedUser);

//       setSuccess("Profile updated successfully!");
//       setError("");
//       console.log("Profile updated in Firebase:", updatedUser);
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       setError("Failed to update profile. Please try again.");
//       setSuccess("");
//     }
//   };

//   // Handle navigation to the dashboard
//   const handleClose = () => {
//     navigate("/dashboard"); // Redirect to dashboard
//   };

//   if (loading) {
//     return <p>Loading profile...</p>;
//   }

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
//       }}
//     >
//       <Paper
//         elevation={3}
//         sx={{
//           padding: 3,
//           borderRadius: 2,
//           backgroundColor: "rgba(255, 255, 255, 0.7)",
//           width: "100%",
//           maxWidth: 600,
//           margin: "5%",
//         }}
//       >
//         <Typography variant="h5" align="center" gutterBottom>
//           Edit Profile
//         </Typography>
//         {error && (
//           <Typography color="error" align="center">
//             {error}
//           </Typography>
//         )}
//         {success && (
//           <Typography color="success.main" align="center">
//             {success}
//           </Typography>
//         )}

//         <form onSubmit={handleSubmit}>
//           <TextField
//             fullWidth
//             label="Name"
//             name="name"
//             value={userData.name}
//             onChange={handleChange}
//             margin="normal"
//             required
//           />
//           <TextField
//             fullWidth
//             label="Email"
//             name="email"
//             value={userData.email}
//             margin="normal"
//             disabled
//           />
//           <TextField
//             fullWidth
//             label="Phone"
//             name="phone"
//             value={userData.phone}
//             onChange={handleChange}
//             margin="normal"
//             required
//           />
//           <TextField
//             fullWidth
//             label="Aadhar No."
//             name="aadhar"
//             value={userData.aadhar}
//             onChange={handleChange}
//             margin="normal"
//             required
//           />
//           <TextField
//             fullWidth
//             label="Driving Licence No."
//             name="license"
//             value={userData.license}
//             onChange={handleChange}
//             margin="normal"
//             required
//           />
//           <TextField
//             fullWidth
//             label="Date of Birth"
//             type="date"
//             name="dob"
//             value={userData.dob}
//             onChange={handleChange}
//             margin="normal"
//             required
//             InputLabelProps={{
//               shrink: true,
//             }}
//           />
//           <TextField
//             fullWidth
//             label="Age"
//             name="age"
//             value={userData.age}
//             InputProps={{
//               readOnly: true,
//             }}
//             margin="normal"
//             disabled
//           />
//           <FormControl fullWidth margin="normal" required>
//             <InputLabel>Gender</InputLabel>
//             <Select
//               name="gender"
//               value={userData.gender}
//               onChange={handleChange}
//             >
//               <MenuItem value="">
//                 <em>Select Gender</em>
//               </MenuItem>
//               <MenuItem value="male">Male</MenuItem>
//               <MenuItem value="female">Female</MenuItem>
//               <MenuItem value="other">Other</MenuItem>
//             </Select>
//           </FormControl>

//           <Typography sx={{ marginTop: 1, marginBottom: 1 }}>
//             Permanent Address
//           </Typography>

//           <TextField
//             fullWidth
//             label="Permanent Address"
//             name="permanentAddressData.address"
//             value={userData.permanentAddressData.permanentAddress}
//             onChange={handleChange}
//             margin="normal"
//             required
//             multiline
//             rows={3}
//           />
//           <TextField
//             fullWidth
//             label="Permanent Address Latitude"
//             name="permanentAddressData.latitude"
//             value={userData.permanentAddressData.latitude}
//             margin="normal"
//             required
//             disabled
//           />
//           <TextField
//             fullWidth
//             label="Permanent Address Longitude"
//             name="permanentAddressData.longitude"
//             value={userData.permanentAddressData.longitude}
//             margin="normal"
//             required
//             disabled
//           />

//           <Button
//             type="button"
//             variant="outlined"
//             onClick={() => setIsPermanentMapOpen(true)}
//           >
//             Select Permanent Address on Map
//           </Button>

//           {isPermanentMapOpen && (
//             <Box
//               sx={{
//                 position: "fixed",
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 zIndex: 999,
//               }}
//             >
//               <Box
//                 sx={{
//                   position: "absolute",
//                   marginTop: 10,
//                   marginLeft: 20,
//                   backgroundColor: "black",
//                   padding: 2,
//                   zIndex: 1000,
//                   borderRadius: 2,
//                   boxShadow: 3,
//                   width: "90vw",
//                   height: "90vw",
//                   maxWidth: "500px",
//                   maxHeight: "500px",
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <Map
//                   onLocationSelect={handlePermanentLocationSelect}
//                   sx={{ width: "100%", height: "100%" }}
//                 />
//                 <Button
//                   variant="outlined"
//                   onClick={() => setIsPermanentMapOpen(false)}
//                   sx={{ marginTop: 2 }}
//                 >
//                   Close Map
//                 </Button>
//               </Box>
//             </Box>
//           )}

//           <FormControlLabel
//             control={
//               <Checkbox
//                 checked={sameAddress}
//                 onChange={handleAddressCheckbox}
//               />
//             }
//             label="Same as Permanent Address"
//           />

//           <TextField
//             fullWidth
//             label="Correspondence Address"
//             name="residentialAddressData.address"
//             value={userData.residentialAddressData.residentialAddress}
//             onChange={handleChange}
//             margin="normal"
//             required
//             multiline
//             rows={3}
//             disabled={sameAddress}
//           />
//           <TextField
//             fullWidth
//             label="Correspondence Address Latitude"
//             name="residentialAddressData.latitude"
//             value={userData.residentialAddressData.latitude}
//             margin="normal"
//             required
//             disabled
//           />
//           <TextField
//             fullWidth
//             label="Correspondence Address Longitude"
//             name="residentialAddressData.longitude"
//             value={userData.residentialAddressData.longitude}
//             margin="normal"
//             required
//             disabled
//           />

//           <Button
//             type="button"
//             variant="outlined"
//             onClick={() => setIsCorrespondenceMapOpen(true)}
//             disabled={sameAddress} // Disable when copying permanent address
//           >
//             Select Correspondence Address on Map
//           </Button>

//           {isCorrespondenceMapOpen && (
//             <Box
//               sx={{
//                 position: "fixed",
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 zIndex: 999,
//               }}
//             >
//               <Box
//                 sx={{
//                   position: "absolute",
//                   marginTop: 10,
//                   marginLeft: 20,
//                   backgroundColor: "black",
//                   padding: 2,
//                   zIndex: 1000,
//                   borderRadius: 2,
//                   boxShadow: 3,
//                   width: "90vw",
//                   height: "90vw",
//                   maxWidth: "500px",
//                   maxHeight: "500px",
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <Map
//                   onLocationSelect={handleCorrespondenceLocationSelect}
//                   sx={{ width: "100%", height: "100%" }}
//                 />
//                 <Button
//                   variant="outlined"
//                   onClick={() => setIsCorrespondenceMapOpen(false)}
//                   sx={{ marginTop: 2 }}
//                 >
//                   Close Map
//                 </Button>
//               </Box>
//             </Box>
//           )}

//           <Box>
//             <Typography sx={{ marginTop: 1, marginBottom: 1 }}>
//               Vehicle Details
//             </Typography>

//             {/* Map through vehicles object and render inputs */}
//             {Object.entries(vehicles).map(([vehicleNumber, vehicle], index) => (
//               <Box
//                 key={index}
//                 sx={{ display: "flex", gap: 2, marginBottom: 2 }}
//               >
//                 {/* Vehicle Type */}
//                 <FormControl fullWidth required>
//                   <InputLabel>Vehicle Type</InputLabel>
//                   <Select
//                     value={vehicle.type}
//                     onChange={(e) =>
//                       handleVehicleChange(vehicleNumber, "type", e.target.value)
//                     }
//                   >
//                     <MenuItem value="LMV">LMV</MenuItem>
//                     <MenuItem value="LMV-TR">LMV-TR</MenuItem>
//                     <MenuItem value="TRANS">TRANS</MenuItem>
//                   </Select>
//                 </FormControl>

//                 {/* Vehicle Number */}
//                 <TextField
//                   fullWidth
//                   label="Vehicle Number"
//                   value={vehicleNumber}
//                   onChange={(e) =>
//                     handleVehicleChange(vehicleNumber, "number", e.target.value)
//                   }
//                   required
//                 />

//                 {/* Delete Icon */}
//                 <IconButton
//                   aria-label="delete"
//                   color="error"
//                   onClick={() => handleDeleteVehicleByKey(vehicleNumber)}
//                 >
//                   <DeleteIcon />
//                 </IconButton>
//               </Box>
//             ))}

//             {/* Add Vehicle Button */}
//             <Button
//               type="button"
//               variant="outlined"
//               onClick={handleAddVehicle}
//               sx={{ marginBottom: 2 }}
//             >
//               Add Vehicle
//             </Button>
//           </Box>

//           <Typography sx={{ marginTop: 2, marginBottom: 1 }}>Wallet Balance</Typography>
//           {/* <TextField
//             fullWidth
//             label="Wallet Balance"
//             name="walletBalance"
//             type="number"
//             value={userData.walletBalance}
//             onChange={handleChange}
//             margin="normal"
//             required
//             inputProps={{ min: 0 }}
//           /> */}
//           <TextField
//             fullWidth
//             label="Wallet Balance"
//             name="walletBalance"
//             type="number"
//             value={userData.walletBalance}
//             onChange={handleChange}
//             margin="normal"
//             required
//             inputProps={{ min: 0 }}
//             error={!!walletError}
//             helperText={walletError}
//           />

//           <Button
//             type="submit"
//             variant="contained"
//             color="primary"
//             fullWidth
//             sx={{ marginTop: 2 }}
//             disabled={!!walletError}
//           >
//             Update Profile
//           </Button>

//           <Button
//             variant="outlined"
//             color="secondary"
//             fullWidth
//             sx={{ marginTop: 2 }}
//             onClick={handleClose}
//           >
//             Close
//           </Button>
//         </form>
//       </Paper>
//     </Box>
//   );
// };

// export default ProfileForm;

/* Three Fields without the add functionality.
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

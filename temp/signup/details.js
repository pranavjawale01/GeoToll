// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAuXGeo-cntx-05XQlE70YQgc5UaqUe4pE",
    authDomain: "location-tracker-firebas-d970f.firebaseapp.com",
    projectId: "location-tracker-firebas-d970f",
    storageBucket: "location-tracker-firebas-d970f.appspot.com",
    messagingSenderId: "36416331605",
    appId: "1:36416331605:android:40dceeb3d969a364da19dc"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage(); // Initialize Firebase Storage for file uploads

// Get IP Address using Ipify
async function getIpAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return null;
    }
}

// Function to handle form submission
document.getElementById("detailsForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const userName = document.getElementById("userName").value;
    const userMobileNo = document.getElementById("userMobileNo").value;
    const userProfile = document.getElementById("userProfile").files[0]; // Get the file object
    const userDOB = document.getElementById("userDOB").value;
    const userAge = document.getElementById("userAge").value;
    const userAddress = document.getElementById("userAddress").value;
    
    // Get selected gender
    const userGender = document.querySelector('input[name="user_gender"]:checked').value;

    const createdAt = new Date().toISOString(); // Current timestamp
    const lastLogin = createdAt; // Same as created for first login
    const loginIpAddress = await getIpAddress(); // Fetch IP address

    let profileImageUrl = "";

    // If profile image is uploaded, upload to Firebase Storage
    if (userProfile) {
        const storageRef = storage.ref(`profiles/${userProfile.name}`);
        try {
            const snapshot = await storageRef.put(userProfile);
            profileImageUrl = await snapshot.ref.getDownloadURL();
        } catch (error) {
            console.error("Error uploading profile image: ", error);
            alert("Error uploading profile image. Please try again.");
            return;
        }
    }

    // Add user details to Firebase Firestore
    db.collection("users").add({
        user_name: userName,
        user_mobileno: parseInt(userMobileNo),
        user_profile: profileImageUrl, // Use the uploaded image URL
        user_dob: userDOB,
        user_age: parseInt(userAge),
        user_address: userAddress,
        user_gender: userGender,
        created_at: createdAt,
        last_login: lastLogin,
        login_ip_address: loginIpAddress
    }).then(() => {
        alert("User details submitted successfully.");
        window.location.href = "/WebApp/login/login.html"; // Redirect after successful submission
    }).catch((error) => {
        console.error("Error adding user: ", error);
        alert("There was an error submitting your details.");
    });
});
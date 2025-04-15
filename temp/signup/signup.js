// Your Firebase configuration (you get this from the Firebase console)
const firebaseConfig = {
    apiKey: "AIzaSyAuXGeo-cntx-05XQlE70YQgc5UaqUe4pE",
    authDomain: "location-tracker-firebas-d970f.firebaseapp.com",
    projectId: "location-tracker-firebas-d970f",
    storageBucket: "location-tracker-firebas-d970f.appspot.com",
    messagingSenderId: "36416331605",
    appId: "1:36416331605:android:40dceeb3d969a364da19dc"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference Firebase Authentication
const auth = firebase.auth();

// Event listener for form submission
document.getElementById("signupForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get the input values from the form
    const email = document.getElementById("userEmail").value;
    const password = document.getElementById("pwd").value;

    // Create a new user with email and password using Firebase Authentication
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Successfully created a new user
            const user = userCredential.user;
            alert("User registration successful!");

            window.location.href = "/WebApp/login/login.html";
        })
        .catch((error) => {
            // Handle registration errors
            const errorCode = error.code;
            const errorMessage = error.message;

            // Display error message
            alert(`Error: ${errorMessage}`);
        });
});
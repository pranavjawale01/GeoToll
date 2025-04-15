const firebaseConfig = {
    apiKey: "AIzaSyAuXGeo-cntx-05XQlE70YQgc5UaqUe4pE",
    authDomain: "location-tracker-firebas-d970f.firebaseapp.com",
    projectId: "location-tracker-firebas-d970f",
    storageBucket: "location-tracker-firebas-d970f.appspot.com",
    messagingSenderId: "36416331605",
    appId: "1:36416331605:android:40dceeb3d969a364da19dc"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.getElementById("loginForm").addEventListener("submit", function(event){
    event.preventDefault();

    const username = document.getElementById("userEmail").value;
    const password = document.getElementById("pwd").value;

    firebase.auth().signInWithEmailAndPassword(username, password)
    .then((userCredential) => {
        alert("Login Successful");
        window.location.href = "/WebApp/map-tracker/public/index.html";
    })
    .catch((error) => {
        alert("Invalid Username or Password: " + error.message);
    });
});
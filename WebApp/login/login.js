document.getElementById("loginForm").addEventListener("submit", function(event){
    event.preventDefault();

    const username = document.getElementById("userEmail").value;
    const password = document.getElementById("pwd").value;

    if(username === "admin" && password === "admin123") {
        alert("Login Successful");
        window.location.href = "home.html";
    } else {
        alert("Invalid Username or Password");
    }
});
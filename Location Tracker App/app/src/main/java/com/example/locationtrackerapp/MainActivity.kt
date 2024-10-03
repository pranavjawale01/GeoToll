package com.example.locationtrackerapp

import android.Manifest
import android.content.Intent
import android.content.IntentSender
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.Looper
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.ToggleButton
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.locationtrackerapp.HelperFunctions.DistanceCalculator
import com.example.locationtrackerapp.HelperFunctions.Firebase
import com.example.locationtrackerapp.HelperFunctions.SpeedCalculator
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser

class MainActivity : ComponentActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var logoutButton: Button
    private lateinit var nameTextView: TextView
    private lateinit var emailTextView: TextView
    private lateinit var toggleButton: ToggleButton
    private lateinit var distanceTextView: TextView
    private lateinit var coordinatesTextView: TextView
    private lateinit var errorTextView: TextView
    private var user: FirebaseUser? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var speedTextView: TextView
    private lateinit var currentDistanceTimeTextView: TextView

    private var totalDistance = 0.0
    private var previousLocation: Location? = null
    private var isTracking = false
    private val REQUEST_CHECK_SETTINGS = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()

        // Initialize UI elements
        logoutButton = findViewById(R.id.logout)
        nameTextView = findViewById(R.id.name_text_view)
        emailTextView = findViewById(R.id.user_details)
        toggleButton = findViewById(R.id.toggle_button)
        distanceTextView = findViewById(R.id.distance_text_view)
        speedTextView = findViewById(R.id.speed_text_view)
        currentDistanceTimeTextView = findViewById(R.id.current_distance_time_text_view)
        coordinatesTextView = findViewById(R.id.coordinates_text_view)
        errorTextView = findViewById(R.id.error_text_view)

        // Get current user
        user = auth.currentUser
        if (user == null) {
            navigateToLogin()
        } else {
            emailTextView.text = user!!.email
            Firebase.fetchUserName(user!!.uid) { name ->
                nameTextView.text = name ?: "Name not found"
            }
        }

        // Initialize location services
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // Location callback
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult?.locations?.forEach { location ->
                    updateLocation(location)
                }
            }
        }

        // Toggle button for tracking location
        toggleButton.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                requestLocationPermission()
            } else {
                stopLocationUpdates()
            }
        }

        // Logout button click
        logoutButton.setOnClickListener {
            auth.signOut()
            navigateToLogin()
        }
    }

    private fun updateLocation(location: Location) {
        coordinatesTextView.text = String.format("Lat: %.8f, Long: %.8f", location.latitude, location.longitude)

        // Save latitude and longitude to Firebase
        Firebase.saveLocation(user!!.uid, location.latitude, location.longitude)

        // Calculate distance, speed, and time interval
        previousLocation?.let { previous ->
            val distance = DistanceCalculator.haversine(previous.latitude, previous.longitude, location.latitude, location.longitude)
            totalDistance += distance.toDouble()
            distanceTextView.text = String.format("Total Distance: %.2f meters", totalDistance)

            // Save total distance to Firebase
            Firebase.saveTotalDistance(user!!.uid, totalDistance)

            // Calculate speed
            val speed = SpeedCalculator.calculateSpeed(previous, location)
            speedTextView.text = String.format("Speed: %.2f km/h", speed)

            // Calculate time interval between updates
            val timeInterval = (location.time - previous.time) / 1000.0 // Time in seconds
            val currentDistanceAndTime = String.format("Current Distance: %.2f m, Time Interval: %.2f s", distance, timeInterval)
            currentDistanceTimeTextView.text = currentDistanceAndTime
            currentDistanceTimeTextView.setTextColor(ContextCompat.getColor(this, android.R.color.black))
        }

        // Update previous location
        previousLocation = location
    }

    private fun navigateToLogin() {
        startActivity(Intent(this, LogIn::class.java))
        finish()
    }

    private fun requestLocationPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 1)
        } else {
            checkLocationSettings()
        }
    }

    private fun checkLocationSettings() {
        val locationRequest = LocationRequest.create().apply {
            interval = 10000 // Set to 2 seconds
            fastestInterval = 5000 // Faster interval for updates
            priority = LocationRequest.PRIORITY_HIGH_ACCURACY
        }

        val locationSettingsRequest = LocationSettingsRequest.Builder()
            .addLocationRequest(locationRequest)
            .build()

        val settingsClient = LocationServices.getSettingsClient(this)
        settingsClient.checkLocationSettings(locationSettingsRequest)
            .addOnSuccessListener {
                startLocationUpdates(locationRequest)
            }
            .addOnFailureListener { exception ->
                if (exception is ResolvableApiException) {
                    try {
                        exception.startResolutionForResult(this, REQUEST_CHECK_SETTINGS)
                    } catch (sendEx: IntentSender.SendIntentException) {
                        showError("Error starting resolution for location settings.")
                    }
                } else {
                    showError("Location settings are not satisfied.")
                }
            }
    }

    private fun startLocationUpdates(locationRequest: LocationRequest) {
        isTracking = true
        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            showError("Location permission not granted")
        }
    }

    private fun stopLocationUpdates() {
        isTracking = false
        fusedLocationClient.removeLocationUpdates(locationCallback)
        previousLocation = null
    }

    private fun showError(message: String) {
        errorTextView.text = message
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 1 && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            checkLocationSettings()
        } else {
            Log.e("MainActivity", "Location permission denied")
            showError("Location permission denied")
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_CHECK_SETTINGS && resultCode == RESULT_OK) {
            requestLocationPermission()
        } else {
            showError("User denied location settings.")
        }
    }
}
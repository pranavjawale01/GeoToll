package com.example.locationtrackerapp

import android.Manifest
import android.content.Intent
import android.content.IntentSender
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.Looper
import android.widget.Button
import android.widget.TextView
import android.widget.ToggleButton
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.locationtrackerapp.HelperFunctions.DistanceCalculator
import com.example.locationtrackerapp.HelperFunctions.FirebaseHelper
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
    private lateinit var speedTextView: TextView
    private lateinit var coordinatesTextView: TextView
    private lateinit var errorTextView: TextView
    private lateinit var highwayTextView: TextView
    private lateinit var highwayNameTextView: TextView
    private lateinit var totalHighwayDistanceTextView: TextView
    private lateinit var currentDistanceTimeTextView: TextView

    private var user: FirebaseUser? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var totalDistance = 0.0
    private var totalHighwayDistance = 0.0
    private var previousLocation: Location? = null
    private var isTracking = false
    private val REQUEST_CHECK_SETTINGS = 1001
    private var lastRequestTime: Long = 0
    private val REQUEST_INTERVAL = 10000

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

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
        highwayTextView = findViewById(R.id.highway_text_view)
        highwayNameTextView = findViewById(R.id.highway_name_text_view)
        totalHighwayDistanceTextView = findViewById(R.id.total_highway_distance_text_view)

        // Get current user information
        user = auth.currentUser
        if (user == null) {
            navigateToLogin()
        } else {
            emailTextView.text = user!!.email

            // Fetch and display user's name and total distance from Firebase
            FirebaseHelper.fetchUserName(user!!.uid) { name ->
                nameTextView.text = name ?: "Name not found"
            }

            FirebaseHelper.getTotalDistance(user!!.uid) { distance ->
                totalDistance = distance ?: 0.0
                distanceTextView.text = String.format("Total Distance: %.2f meters", totalDistance)
            }

            FirebaseHelper.getTotalHighwayDistance(user!!.uid) { distance ->
                totalHighwayDistance = distance ?: 0.0
                totalHighwayDistanceTextView.text = String.format("Total Highway Distance: %.2f meters", totalHighwayDistance)
            }
        }

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult?.locations?.forEach { location ->
                    updateLocation(location)
                }
            }
        }

        // Toggle button for starting/stopping location tracking
        toggleButton.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                requestLocationPermission()
            } else {
                stopLocationUpdates()
            }
        }

        // Logout button listener
        logoutButton.setOnClickListener {
            auth.signOut()
            navigateToLogin()
        }
    }

    private fun updateLocation(location: Location) {
        coordinatesTextView.text = String.format("Lat: %.8f, Long: %.8f", location.latitude, location.longitude)

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastRequestTime < REQUEST_INTERVAL) {
            return
        }
        lastRequestTime = currentTime

        previousLocation?.let { previous ->
            val distance = DistanceCalculator.haversine(previous.latitude, previous.longitude, location.latitude, location.longitude)
            totalDistance += distance.toDouble()
            distanceTextView.text = String.format("Total Distance: %.2f meters", totalDistance)

            // Save total distance to Firebase
            FirebaseHelper.saveTotalDistance(user!!.uid, totalDistance)

            // Calculate and display speed
            val speed = SpeedCalculator.calculateSpeed(previous, location)
            speedTextView.text = String.format("Speed: %.2f km/h", speed)

            // Calculate time interval between updates
            val timeInterval = (location.time - previous.time) / 1000.0
            currentDistanceTimeTextView.text = String.format("Current Distance: %.2f m, Time Interval: %.2f s", distance, timeInterval)

            // Check if the current location is on a highway
            HighwayChecker.isHighway(HighwayChecker.Coordinates(location.latitude, location.longitude)) { result, highwayName ->
                runOnUiThread {
                    val isOnHighway = when (result) {
                        5, 6 -> { // Highway detection success based on name/ref
                            highwayTextView.text = "\n\nYou are on a highway!"
                            totalHighwayDistance += distance.toDouble()
                            FirebaseHelper.saveTotalHighwayDistance(
                                user!!.uid,
                                totalHighwayDistance
                            )
                            true
                        }

                        4 -> {
                            highwayTextView.text = "\n\nYou are not on a highway."
                            false
                        }

                        0 -> {
                            highwayTextView.text = "\n\nAPI failure."
                            false
                        }

                        1 -> {
                            highwayTextView.text = "\n\nRequest failed."
                            false
                        }

                        2 -> {
                            highwayTextView.text = "\n\nParsing error."
                            false
                        }

                        else -> {
                            highwayTextView.text = "\n\nUnknown response."
                            false
                        }
                    }

                    highwayNameTextView.text = highwayName ?: "Road name not available"
                    totalHighwayDistanceTextView.text =
                        String.format("Total Highway Distance: %.2f meters", totalHighwayDistance)

                    // Save the location with an indicator of whether the user is on a highway or not
                    FirebaseHelper.saveLocation(
                        user!!.uid,
                        location.latitude,
                        location.longitude,
                        isOnHighway
                    )
                }
            }
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
            interval = 10000 // 10 seconds interval
            fastestInterval = 5000 // 5 seconds fastest interval
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
                        showError("Error resolving location settings.")
                    }
                } else {
                    showError("Location settings are unsatisfied.")
                }
            }
    }

    private fun startLocationUpdates(locationRequest: LocationRequest) {
        isTracking = true
        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            showError("Location permission not granted.")
        }
    }

    private fun stopLocationUpdates() {
        isTracking = false
        previousLocation = null
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    private fun showError(message: String) {
        errorTextView.text = message
    }
}
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
    private lateinit var speedTextView: TextView
    private lateinit var coordinatesTextView: TextView
    private lateinit var errorTextView: TextView
    private lateinit var highwayTextView: TextView
    private lateinit var highwayNameTextView: TextView
    private lateinit var currentDistanceTimeTextView: TextView
    private lateinit var todayTotalDistanceTextView: TextView
    private lateinit var todayTotalHighwayDistanceTextView: TextView
    private lateinit var totalDistanceKmTextView: TextView
    private lateinit var totalHighwayDistanceKmTextView: TextView

    private var user: FirebaseUser? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var totalHighwayDistanceKm = 0.0
    private var totalDistanceKm = 0.0
    private var todayTotalDistance = 0.0
    private var todayTotalHighwayDistance = 0.0
    private var previousLocation: Location? = null
    private var isTracking = false
    private val REQUEST_CHECK_SETTINGS = 1001
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
        speedTextView = findViewById(R.id.speed_text_view)
        currentDistanceTimeTextView = findViewById(R.id.current_distance_time_text_view)
        coordinatesTextView = findViewById(R.id.coordinates_text_view)
        errorTextView = findViewById(R.id.error_text_view)
        highwayTextView = findViewById(R.id.highway_text_view)
        highwayNameTextView = findViewById(R.id.highway_name_text_view)
        todayTotalDistanceTextView = findViewById(R.id.today_total_distance_text_view)
        todayTotalHighwayDistanceTextView = findViewById(R.id.today_total_highway_distance_text_view)
        totalDistanceKmTextView = findViewById(R.id.total_distance_km_text_view)
        totalHighwayDistanceKmTextView = findViewById(R.id.total_highway_distance_km_text_view)

        // Get current user information
        user = auth.currentUser
        if (user == null) {
            navigateToLogin()
        } else {
            emailTextView.text = user!!.email

            // Fetch and display user's name from Firebase
            FirebaseHelper.fetchUserName(user!!.uid) { name ->
                nameTextView.text = name ?: "Name not found"
            }

            FirebaseHelper.getTotalDistance(user!!.uid) { distance ->
                totalDistanceKm = distance ?: 0.0
                totalDistanceKmTextView.text = String.format("Total Distance: %.2f km", totalDistanceKm / 1000.0)
            }

            FirebaseHelper.getTotalHighwayDistance(user!!.uid) { distance ->
                totalHighwayDistanceKm = distance ?: 0.0
                totalHighwayDistanceKmTextView.text = String.format("Total Highway Distance: %.2f km", totalHighwayDistanceKm / 1000.0)
            }

            FirebaseHelper.getTodayTotalDistance(user!!.uid) { distance ->
                todayTotalDistance = distance ?: 0.0
                todayTotalDistanceTextView.text = String.format("Today's Total Distance: %.2f m", todayTotalDistance)
            }

            FirebaseHelper.getTodayTotalHighwayDistance(user!!.uid) { distance ->
                todayTotalHighwayDistance = distance ?: 0.0
                todayTotalHighwayDistanceTextView.text = String.format("Today's Total Highway Distance: %.2f m", todayTotalHighwayDistance)
            }
        }

        // Initialize FusedLocationProviderClient
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // Set up location callback
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
                user?.let {
                    FirebaseHelper.saveTotalDistance(it.uid, totalDistanceKm)
                    FirebaseHelper.saveTotalHighwayDistance(it.uid, totalHighwayDistanceKm)
                    FirebaseHelper.saveTodayTotalDistance(it.uid, todayTotalDistance)
                    FirebaseHelper.saveTodayTotalHighwayDistance(it.uid, todayTotalHighwayDistance)
                }
            }
        }

        // Logout button listener
        logoutButton.setOnClickListener {
            user?.let {
                FirebaseHelper.saveTotalDistance(it.uid, totalDistanceKm)
                FirebaseHelper.saveTotalHighwayDistance(it.uid, totalHighwayDistanceKm)
                FirebaseHelper.saveTodayTotalDistance(it.uid, todayTotalDistance)
                FirebaseHelper.saveTodayTotalHighwayDistance(it.uid, todayTotalHighwayDistance)
            }
            auth.signOut()
            navigateToLogin()
        }
    }

    private fun updateLocation(location: Location) {
        coordinatesTextView.text = String.format("Lat: %.8f, Long: %.8f", location.latitude, location.longitude)

        previousLocation?.let { previous ->
            val distance = DistanceCalculator.haversine(previous.latitude, previous.longitude, location.latitude, location.longitude)
            todayTotalDistance += distance.toDouble()
            totalDistanceKm += distance.toDouble()
            // Update today's total distance
            todayTotalDistanceTextView.text = String.format("Today's Total Distance: %.2f m", todayTotalDistance)
            totalDistanceKmTextView.text = String.format("Total Distance: %.2f km", totalDistanceKm / 1000.0)

            val speed = SpeedCalculator.calculateSpeed(previous, location)
            speedTextView.text = String.format("Speed: %.2f km/h", speed)

            val timeInterval = (location.time - previous.time) / 1000.0
            currentDistanceTimeTextView.text = String.format("Current Distance: %.2f m, Time Interval: %.2f s", distance, timeInterval)

            // Check if user is on a highway
            HighwayCheckerOSM.isHighway(HighwayCheckerOSM.Coordinates(location.latitude, location.longitude)) { result, highwayName ->
                runOnUiThread {
                    val isOnHighway = when (result) {
                        5 -> {
                            highwayTextView.text = "\nYou are on a highway!"
                            todayTotalHighwayDistance += distance.toDouble()
                            totalHighwayDistanceKm += distance.toDouble()

                            // Update today's total highway distance
                            todayTotalHighwayDistanceTextView.text = String.format("Today's Total Highway Distance: %.2f m", todayTotalHighwayDistance)
                            totalHighwayDistanceKmTextView.text = String.format("Total Highway Distance: %.2f km", totalHighwayDistanceKm / 1000.0)
                            true
                        }
                        4 -> {
                            highwayTextView.text = "\nYou are not on a highway."
                            false
                        }

                        0 -> {
                            highwayTextView.text = "\nAPI failure."
                            false
                        }

                        1 -> {
                            highwayTextView.text = "\nRequest failed."
                            false
                        }

                        2 -> {
                            highwayTextView.text = "\nParsing error."
                            false
                        }

                        3 -> {
                            highwayTextView.text = "\nNo response body."
                            false
                        }

                        else -> {
                            highwayTextView.text = "\nUnknown response."
                            false
                        }
                    }

                    highwayNameTextView.text = highwayName ?: "Road name not available"

                    // Save the location and highway status
                    user?.let {
                        FirebaseHelper.saveLocation(it.uid, location.latitude, location.longitude, isOnHighway)
                    }
                }
            }
        }

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
            startLocationUpdates()
        }
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.create().apply {
            interval = 10000
            fastestInterval = 5000
            priority = LocationRequest.PRIORITY_HIGH_ACCURACY
        }

        val builder = LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
        val client = LocationServices.getSettingsClient(this)
        val task = client.checkLocationSettings(builder.build())

        task.addOnSuccessListener {
            startLocationUpdates(locationRequest)
        }

        task.addOnFailureListener { exception ->
            if (exception is ResolvableApiException) {
                try {
                    exception.startResolutionForResult(this, REQUEST_CHECK_SETTINGS)
                } catch (sendEx: IntentSender.SendIntentException) {
                    // Handle error
                }
            }
        }
    }

    private fun startLocationUpdates(locationRequest: LocationRequest) {
        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        isTracking = true
    }

    private fun stopLocationUpdates() {
        if (isTracking) {
            fusedLocationClient.removeLocationUpdates(locationCallback)
            isTracking = false
            previousLocation = null
        }
    }
}
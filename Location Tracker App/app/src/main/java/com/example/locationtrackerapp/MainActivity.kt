package com.example.locationtrackerapp

import android.Manifest
import android.content.Intent
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
import com.google.android.gms.location.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.database.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import kotlin.math.*

class MainActivity : ComponentActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var button: Button
    private lateinit var nameTextView: TextView
    private lateinit var emailTextView: TextView
    private lateinit var toggleButton: ToggleButton
    private lateinit var distanceTextView: TextView
    private lateinit var coordinatesTextView: TextView
    private lateinit var errorTextView: TextView
    private var user: FirebaseUser? = null
    private lateinit var database: DatabaseReference
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    private var totalDistance = 0.0
    private var previousLocation: Location? = null
    private var isTracking = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()

        // Initialize UI elements
        button = findViewById(R.id.logout)
        nameTextView = findViewById(R.id.name_text_view)
        emailTextView = findViewById(R.id.user_details)
        toggleButton = findViewById(R.id.toggle_button)
        distanceTextView = findViewById(R.id.distance_text_view)
        coordinatesTextView = findViewById(R.id.coordinates_text_view)
        errorTextView = findViewById(R.id.error_text_view)

        // Get current user
        user = auth.currentUser
        if (user == null) {
            navigateToLogin()
        } else {
            emailTextView.text = user!!.email
            fetchUserName(user!!.uid)
        }

        // Initialize location services
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // Location callback
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult ?: return
                for (location in locationResult.locations) {
                    updateLocation(location)
                }
            }
        }

        // Toggle button for tracking location
        toggleButton.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 1)
                } else {
                    startLocationUpdates()
                }
            } else {
                stopLocationUpdates()
            }
        }

        // Logout button click
        button.setOnClickListener {
            auth.signOut()
            navigateToLogin()
        }
    }

    private fun updateLocation(location: Location) {
        coordinatesTextView.text = String.format("Lat: %.6f, Long: %.6f", location.latitude, location.longitude)

        previousLocation?.let { previous ->
            val distance = previous.distanceTo(location) // Using Location's built-in method
            totalDistance += distance
            distanceTextView.text = String.format("Total Distance: %.2f meters", totalDistance)
        }

        previousLocation = location
    }

    private fun fetchUserName(userId: String) {
        database = Firebase.database.reference

        database.child("users").child(userId).child("name")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val name = snapshot.getValue(String::class.java) ?: "Name not found"
                    nameTextView.text = name
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("MainActivity", "Error fetching name", error.toException())
                    showError("Error fetching name")
                }
            })
    }

    private fun navigateToLogin() {
        startActivity(Intent(this, LogIn::class.java))
        finish()
    }

    private fun startLocationUpdates() {
        isTracking = true
        val locationRequest = LocationRequest.create().apply {
            interval = 2000
            fastestInterval = 1000
            priority = LocationRequest.PRIORITY_HIGH_ACCURACY
        }

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
            startLocationUpdates()
        } else {
            Log.e("MainActivity", "Location permission denied")
            showError("Location permission denied")
        }
    }
}
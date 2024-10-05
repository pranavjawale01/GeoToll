package com.example.geotoll

import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import android.Manifest
import android.location.Location
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.Priority


class LocationTrackerActivity : AppCompatActivity() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var database: DatabaseReference
    private lateinit var userId: String
    private var isTracking = false  // Variable to track if location tracking is ongoing
    private lateinit var locationRequest: LocationRequest
    private lateinit var handler: Handler  // Move handler declaration here
    private lateinit var runnable: Runnable

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(locationResult: LocationResult) {
            for (location in locationResult.locations) {
                if (location != null) {
                    val lat = location.latitude
                    val lon = location.longitude
                    addLocationToFirebase(lat, lon)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_location_tracker)

        /*
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        database = FirebaseDatabase.getInstance().getReference("Users")

        userId = intent.getStringExtra("uniqueId").toString()

        val startTrackingButton = findViewById<Button>(R.id.btnStartTracking)
        val stopTrackingButton = findViewById<Button>(R.id.btnStopTracking)

        startTrackingButton.setOnClickListener {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 1)
                return@setOnClickListener
            }
            startLocationTracking()
        }

        stopTrackingButton.setOnClickListener {
            // Handle stop tracking
            Toast.makeText(this, "Location tracking stopped", Toast.LENGTH_SHORT).show()
        }
    }

    private fun startLocationTracking() {
        val handler = Handler(Looper.getMainLooper())
        val interval: Long = 5000 // 5 seconds interval

        val runnable = object : Runnable {
            override fun run() {
                if (ActivityCompat.checkSelfPermission(this@LocationTrackerActivity, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    return
                }
                fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
                    if (location != null) {
                        val lat = location.latitude
                        val lon = location.longitude
                        addLocationToFirebase(lat, lon)
                    }
                }
                handler.postDelayed(this, interval)
            }
        }

        // Start the periodic location tracking
        handler.post(runnable)
    }

    private fun addLocationToFirebase(lat: Double, lon: Double) {
        val locationData = mapOf(
            "latitude" to lat,
            "longitude" to lon
        )

        database.child(userId).child("locationHistory").push().setValue(locationData)
            .addOnSuccessListener {
                Toast.makeText(this, "Location added to Firebase", Toast.LENGTH_SHORT).show()
            }
            .addOnFailureListener {
                Toast.makeText(this, "Failed to add location", Toast.LENGTH_SHORT).show()
            }*/


        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        database = FirebaseDatabase.getInstance().getReference("Users")
        userId = intent.getStringExtra("uniqueId").toString()

        val startTrackingButton = findViewById<Button>(R.id.btnStartTracking)
        val stopTrackingButton = findViewById<Button>(R.id.btnStopTracking)

        startTrackingButton.setOnClickListener {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 1)
            } else {
                if (!isTracking) {
                    startLocationTracking()
                    isTracking = true
                    Toast.makeText(this, "Location tracking started", Toast.LENGTH_SHORT).show()
                }
            }
        }

        stopTrackingButton.setOnClickListener {
            if (isTracking) {
                fusedLocationClient.removeLocationUpdates(locationCallback)  // Stop location updates
                isTracking = false
                Toast.makeText(this, "Location tracking stopped", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode == 1) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startLocationTracking()
                isTracking = true
                Toast.makeText(this, "Location tracking started", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Location permission denied", Toast.LENGTH_SHORT).show()
            }
        }
    }

    /*
    private fun startLocationTracking() {
        locationRequest = LocationRequest.create().apply {
            interval = 4000 // 5 seconds interval for updates
            fastestInterval = 2000 // Fastest possible interval
            priority = LocationRequest.PRIORITY_HIGH_ACCURACY // High accuracy for GPS
        }

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        }
    }*/

    private fun startLocationTracking() {
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, // High accuracy for GPS
            3000 // 3 seconds interval for updates
        ).apply {
            setMinUpdateIntervalMillis(1000) // Minimum time between updates (1 second)
            setWaitForAccurateLocation(true) // Wait for more accurate location
        }.build()

        // Check if location permission is granted
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            // Start requesting location updates
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        }
    }


    private fun addLocationToFirebase(lat: Double, lon: Double) {
        val locationData = mapOf(
            "latitude" to lat,
            "longitude" to lon
        )

        database.child(userId).child("locationHistory").push().setValue(locationData)
            .addOnSuccessListener {
                Toast.makeText(this, "Location added to Firebase", Toast.LENGTH_SHORT).show()
            }
            .addOnFailureListener {
                Toast.makeText(this, "Failed to add location", Toast.LENGTH_SHORT).show()
            }
    }
}

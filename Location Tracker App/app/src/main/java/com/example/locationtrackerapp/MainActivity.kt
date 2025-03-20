package com.example.locationtrackerapp

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.Spinner
import android.widget.TextView
import android.widget.ToggleButton
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.example.locationtrackerapp.HelperFunctions.DistanceCalculator
import com.example.locationtrackerapp.HelperFunctions.FirebaseHelper
import com.example.locationtrackerapp.HelperFunctions.SpeedCalculator
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import java.util.Calendar
import kotlin.text.*

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
    private lateinit var vehicleSpinner: Spinner

    private var user: FirebaseUser? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var totalHighwayDistanceKm = 0.0
    private var totalDistanceKm = 0.0
    private var isTracking = false
    private val REQUEST_CHECK_SETTINGS = 1001
    private var currentVehicleId: String? = null
    private var previousVehicleId: String? = null

    // Companion object to store the previous location, accessible by other classes
    companion object {
        var previousLocation: Location? = null
        var todayTotalDistance: Double = 0.0
        var todayTotalHighwayDistance: Double = 0.0
    }

    private fun initUI() {
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
        vehicleSpinner = findViewById(R.id.vehicle_spinner)
    }

    // GPS IS ENABLED BUT NOT WORKING
    fun isGpsWorking(): Boolean {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
    }

    fun isGpsAvailable(): Boolean {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return locationManager.allProviders.contains(LocationManager.GPS_PROVIDER)
    }

    fun sendGpsNotWorkingNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notification = NotificationCompat.Builder(this, "GPS_STATUS_CHANNEL")
            .setSmallIcon(R.drawable.ic_warning)
            .setContentTitle("GPS Issue")
            .setContentText("GPS is available but not working properly. Please check your GPS settings.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        notificationManager.notify(1, notification)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        auth = FirebaseAuth.getInstance()

        // Initialize UI elements
        initUI()

        // Get current user information
        user = auth.currentUser
        if (user == null) {
            navigateToLogin()
        } else {
            emailTextView.text = user!!.email

            // Fetch vehicles only if user ID is not null or blank
            val userId = user?.uid

            if (userId != null) {
                FirebaseHelper.getTheBoundingBoxData(userId, "6dc7fb95a3b246cfa0f3bcef5ce9ed9a")
            } else {
                Log.e("FirebaseHelper", "User ID is null. User might not be logged in.")
            }

            if (!userId.isNullOrBlank()) {
                fun fetchAndPopulateVehicles() {
                    FirebaseHelper.fetchVehiclesFromFirebase { vehicleList ->
                        val filteredVehicleList = vehicleList.filter { !it.isNullOrBlank() && it != "null" }

                        if (filteredVehicleList.isNotEmpty()) {
                            val adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_item, filteredVehicleList)
                            adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                            vehicleSpinner.adapter = adapter
                        } else {
                            println("Vehicle list is empty after filtering, disabling UI")
                            disableUI()
                        }
                    }
                }

                fetchAndPopulateVehicles()

                vehicleSpinner.setOnTouchListener { _, _ ->
                    fetchAndPopulateVehicles()
                    false // Allow the touch event to propagate
                }
            } else {
                println("User ID is null or blank, cannot fetch vehicles")
            }


            // Handle vehicle selection safely
            vehicleSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    if (position > 0) { // Ensure user selects a valid vehicle
                        val newVehicleId = parent?.getItemAtPosition(position)?.toString()

                        if (!newVehicleId.isNullOrBlank() && newVehicleId != previousVehicleId) {
                            user?.uid?.takeIf { it.isNotBlank() }?.let { userId ->
                                previousVehicleId?.let { FirebaseHelper.setVehicleInactive(userId, it) }
                                FirebaseHelper.setVehicleActive(userId, newVehicleId, true)

                                currentVehicleId = newVehicleId
                                previousVehicleId = newVehicleId

                                enableUI()
                            } ?: println("User ID is null or blank, cannot set vehicle active")
                        }
                    } else {
                        stopLocationUpdates()
                        disableUI()
                    }
                }

                override fun onNothingSelected(parent: AdapterView<*>?) {
                    previousVehicleId?.let {
                        FirebaseHelper.setVehicleInactive(user!!.uid, it)
                    }
                    currentVehicleId?.let {
                        FirebaseHelper.setVehicleInactive(user!!.uid, it)
                    }
                    currentVehicleId = null
                    previousVehicleId = null
                    stopLocationUpdates()
                    disableUI() // Keep UI disabled if nothing is selected
                }
            }

            // Fetch and display user's name from Firebase
            FirebaseHelper.fetchUserName(user!!.uid) { name ->
                nameTextView.text = name ?: "Name not found"
            }

            // Intitalize the views with data
            // getVehicleData(user!!.uid, currentVehicleId!!)
        }

        // Initialize FusedLocationProviderClient
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // Set up location callback
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.locations.forEach { location ->
                    updateLocation(location)
                }
            }
        }

        // Toggle button for starting/stopping location tracking
        toggleButton.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                requestLocationPermission()
                user?.uid?.let { userId ->
                    currentVehicleId?.let { vehicleId ->
                        getVehicleData(userId, vehicleId)
                        if (isGpsAvailable() && !isGpsWorking()) {
                            userId?.let { FirebaseHelper.sendGpsStatusToFirebase(userId, false) }
                            println("GPS is available but not working, reported to Firebase")
                            sendGpsNotWorkingNotification()
                        }
                    }
                }
            } else {
                stopLocationUpdates()
                user?.uid?.let { userId ->
                    currentVehicleId?.let { vehicleId ->
                        saveVehicleData(userId, vehicleId)
                        previousLocation = null
                    }
                }
                /*
                user?.let {
                    currentVehicleId?.let { vehicleId -> FirebaseHelper.setVehicleInactive(user!!.uid, vehicleId) }
                    currentVehicleId = null
                }
                */

                user?.let {
                    previousVehicleId?.let { vehicleId -> FirebaseHelper.setVehicleInactive(user!!.uid, vehicleId) }
                    currentVehicleId?.let { vehicleId -> FirebaseHelper.setVehicleInactive(user!!.uid, vehicleId) }

                    currentVehicleId = null
                    previousVehicleId = null
                }
            }
        }

        // Logout button listener
        logoutButton.setOnClickListener {
            user?.uid?.let { userId ->
                currentVehicleId?.let { vehicleId ->
                    saveVehicleData(userId, vehicleId)
                }
            }
            user?.uid?.let { userId ->
                previousVehicleId?.let { vehicleId -> FirebaseHelper.setVehicleInactive(userId, vehicleId) }
                currentVehicleId?.let { vehicleId -> FirebaseHelper.setVehicleInactive(userId, vehicleId) }

                currentVehicleId = null
                previousVehicleId = null

                // Save vehicle data before logging out
                currentVehicleId?.let { vehicleId -> saveVehicleData(userId, vehicleId) }
            }

            auth.signOut()
            navigateToLogin()
        }

        // Schedule the daily reset of distances at midnight
        scheduleDailyReset()
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

            var speedLimit: Int = 80 // Initialize with a default value

            HighwayCheckerOSM.speedProviderForRoads(HighwayCheckerOSM.Coordinates(location.latitude, location.longitude)) { speedTemp ->
                speedLimit = speedTemp
                println("Speed limit updated: $speedLimit km/h")
            }

            if (speed > speedLimit) {
                if (currentVehicleId != null) {
                    FirebaseHelper.saveOverSpeedPenalty(user!!.uid, location, speed, speedLimit, currentVehicleId!!)
                } else {
                    Log.e("MainActivity", "Error: currentVehicleId is null, cannot save penalty!")
                }
            }

            val timeInterval = (location.time - previous.time) / 1000.0
            currentDistanceTimeTextView.text = String.format("Current Distance: %.2f m, Time Interval: %.2f s", distance, timeInterval)

            // Save the location and highway status
            val isInsideBoundingBox = BoundingBoxChecker.isCoordinateInsideResidentialAddressBoundingBoxOrPermanentAddressBoundingBox(location.latitude, location.longitude)
            println("Is inside bounding box? $isInsideBoundingBox")

            // Check if user is on a highway
            HighwayCheckerOSM.isHighway(HighwayCheckerOSM.Coordinates(location.latitude, location.longitude)) { result, highwayName ->
                runOnUiThread {
                    val isOnHighway = when (result) {
                        5 -> {
                            if (isInsideBoundingBox) {
                                highwayTextView.text = "\nYou are on a highway But Inside Your Bounding Box!"
                            } else {
                                highwayTextView.text = "\nYou are on a highway!"
                                todayTotalHighwayDistance += distance.toDouble()
                                totalHighwayDistanceKm += distance.toDouble()
                            }

                            // Update today's total highway distance
                            todayTotalHighwayDistanceTextView.text = String.format("Today's Total Highway Distance\n -- %.2f m --", todayTotalHighwayDistance)
                            totalHighwayDistanceKmTextView.text = String.format("Total Highway Distance\n -- %.2f km --", totalHighwayDistanceKm / 1000.0)
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

                    user?.let {
                        currentVehicleId?.let { vehicleId ->
                            FirebaseHelper.saveLocation(it.uid, vehicleId, location.latitude, location.longitude, isOnHighway, isInsideBoundingBox)
                        }
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

    // Updated startLocationUpdates function to handle permission properly
    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e("MainActivity", "Location permission not granted")
            return
        }

        val locationRequest = LocationRequest.create().apply {
            interval = 10000
            fastestInterval = 5000
            priority = LocationRequest.PRIORITY_HIGH_ACCURACY
        }

        val builder = LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
        val client = LocationServices.getSettingsClient(this)
        val task = client.checkLocationSettings(builder.build())

        task.addOnSuccessListener {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
            isTracking = true
        }

        task.addOnFailureListener { exception ->
            if (exception is ResolvableApiException) {
                try {
                    exception.startResolutionForResult(this, REQUEST_CHECK_SETTINGS)
                } catch (sendEx: IntentSender.SendIntentException) {
                    Log.e("MainActivity", "Error starting resolution for location settings", sendEx)
                }
            }
        }

        user?.uid?.let { userId ->
            currentVehicleId?.let { vehicleId ->
                getVehicleData(userId, vehicleId)
            }
        }
    }

    private fun startLocationUpdates(locationRequest: LocationRequest) {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            return
        }
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


    override fun onStop() {
        super.onStop()
        if (isTracking) {
            user?.uid?.let { userId ->
                currentVehicleId?.let { vehicleId ->
                    saveVehicleData(userId, vehicleId)
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
                previousVehicleId?.let { vehicleId ->
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
            }
        } else {
            user?.uid?.let { userId ->
                currentVehicleId?.let { vehicleId ->
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
                previousVehicleId?.let { vehicleId ->
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isTracking) {
            user?.uid?.let { userId ->
                currentVehicleId?.let { vehicleId ->
                    saveVehicleData(userId, vehicleId)
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
                previousVehicleId?.let { vehicleId ->
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
            }
        } else {
            user?.uid?.let { userId ->
                currentVehicleId?.let { vehicleId ->
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
                previousVehicleId?.let { vehicleId ->
                    FirebaseHelper.setVehicleInactive(userId, vehicleId)
                }
            }
        }
    }


    private fun getVehicleData(userId: String, vehicleId: String) {
        FirebaseHelper.getTotalDistance(userId, vehicleId) { distance ->
            totalDistanceKm = distance ?: 0.0
            totalDistanceKmTextView.text = String.format("Total Distance: %.2f km", totalDistanceKm / 1000.0)
        }

        FirebaseHelper.getTotalHighwayDistance(userId, vehicleId) { distance ->
            totalHighwayDistanceKm = distance ?: 0.0
            totalHighwayDistanceKmTextView.text = String.format("Total Highway Distance: %.2f km", totalHighwayDistanceKm / 1000.0)
        }

        FirebaseHelper.getTodayTotalDistance(userId, vehicleId) { distance ->
            todayTotalDistance = distance ?: 0.0
            todayTotalDistanceTextView.text = String.format("Today's Total Distance: %.2f m", todayTotalDistance)
        }

        FirebaseHelper.getTodayTotalHighwayDistance(userId, vehicleId) { distance ->
            todayTotalHighwayDistance = distance ?: 0.0
            todayTotalHighwayDistanceTextView.text = String.format("Today's Total Highway Distance: %.2f m", todayTotalHighwayDistance)
        }
    }


    private fun saveVehicleData(userId: String, vehicleId: String) {
        FirebaseHelper.saveTodayTotalHighwayDistance(userId, vehicleId, todayTotalHighwayDistance)
        FirebaseHelper.saveTodayTotalDistance(userId, vehicleId, todayTotalDistance)
        FirebaseHelper.saveTotalHighwayDistance(userId, vehicleId, totalHighwayDistanceKm)
        FirebaseHelper.saveTotalDistance(userId, vehicleId, totalDistanceKm)
        /*
        todayTotalHighwayDistance = 0.0
        todayTotalDistance = 0.0
        totalHighwayDistanceKm = 0.0
        totalDistanceKm = 0.0
         */
    }

    private fun disableUI() {
        toggleButton.isEnabled = false
        /**
        speedTextView.isEnabled = false
        currentDistanceTimeTextView.isEnabled = false
        coordinatesTextView.isEnabled = false
        errorTextView.isEnabled = false
        highwayTextView.isEnabled = false
        highwayNameTextView.isEnabled = false
        todayTotalDistanceTextView.isEnabled = false
        todayTotalHighwayDistanceTextView.isEnabled = false
        totalDistanceKmTextView.isEnabled = false
        totalHighwayDistanceKmTextView.isEnabled = false
         **/

        // Set UI transparency to give a "frozen" effect
        toggleButton.alpha = 0.5f
        speedTextView.alpha = 0.5f
        currentDistanceTimeTextView.alpha = 0.5f
        coordinatesTextView.alpha = 0.5f
        errorTextView.alpha = 0.5f
        highwayTextView.alpha = 0.5f
        highwayNameTextView.alpha = 0.5f
        todayTotalDistanceTextView.alpha = 0.5f
        todayTotalHighwayDistanceTextView.alpha = 0.5f
        totalDistanceKmTextView.alpha = 0.5f
        totalHighwayDistanceKmTextView.alpha = 0.5f
    }

    private fun enableUI() {
        toggleButton.isEnabled = true
        speedTextView.isEnabled = true
        currentDistanceTimeTextView.isEnabled = true
        coordinatesTextView.isEnabled = true
        errorTextView.isEnabled = true
        highwayTextView.isEnabled = true
        highwayNameTextView.isEnabled = true
        todayTotalDistanceTextView.isEnabled = true
        todayTotalHighwayDistanceTextView.isEnabled = true
        totalDistanceKmTextView.isEnabled = true
        totalHighwayDistanceKmTextView.isEnabled = true

        // Restore full opacity when active
        toggleButton.alpha = 1.0f
        speedTextView.alpha = 1.0f
        currentDistanceTimeTextView.alpha = 1.0f
        coordinatesTextView.alpha = 1.0f
        errorTextView.alpha = 1.0f
        highwayTextView.alpha = 1.0f
        highwayNameTextView.alpha = 1.0f
        todayTotalDistanceTextView.alpha = 1.0f
        todayTotalHighwayDistanceTextView.alpha = 1.0f
        totalDistanceKmTextView.alpha = 1.0f
        totalHighwayDistanceKmTextView.alpha = 1.0f
    }


    private fun scheduleDailyReset() {
        val calendar = Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis()
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 55)
        }

        val currentTime = System.currentTimeMillis()
        val initialDelay = calendar.timeInMillis - currentTime

        val handler = android.os.Handler(Looper.getMainLooper())
        handler.postDelayed({
            user?.uid?.let { userId ->
                currentVehicleId?.let { vehicleId ->
                    saveVehicleData(userId, vehicleId)
                    previousLocation = null
                    getVehicleData(userId, vehicleId)
                    Log.d("DailyReset", "Daily reset complete for vehicle $vehicleId")
                }
            }
        }, initialDelay)
    }
}
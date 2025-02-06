package com.example.locationtrackerapp.HelperFunctions

import android.R
import android.icu.text.SimpleDateFormat
import android.location.Location
import android.util.Log
import android.widget.ArrayAdapter
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.util.Date
import java.util.Locale

object FirebaseHelper {

    private val database: DatabaseReference = Firebase.database.reference

    /**
     * Fetches available vehicles (not in use) from Firebase and returns them via a callback.
     */
    fun fetchVehiclesFromFirebase(callback: (List<String>) -> Unit) {
        val userId = FirebaseAuth.getInstance().currentUser?.uid ?: return

        database.child("users").child(userId).child("vehicles")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val vehicleList = mutableListOf<String>()
                    vehicleList.add("Select Vehicle") // Default option

                    for (vehicleSnapshot in snapshot.children) {
                        val vehicleId = vehicleSnapshot.key ?: continue
                        val vehicleInUse =
                            vehicleSnapshot.child("vehicle_in_used").getValue(Boolean::class.java)
                                ?: false

                        if (!vehicleInUse) {
                            vehicleList.add(vehicleId)
                        }
                    }
                    callback(vehicleList) // Return the list to MainActivity
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseHelper", "Error fetching vehicles", error.toException())
                    callback(emptyList()) // Return empty list in case of error
                }
            })
    }

    fun setVehicleActive(userId: String, vehicleId: String, isActive: Boolean) {
        val vehicleRef = database.child("users").child(userId).child("vehicles").child(vehicleId)

        // Update the vehicle status
        vehicleRef.child("vehicle_in_used").setValue(isActive)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Vehicle $vehicleId set to active: $isActive")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating vehicle status", error)
            }
    }

    fun setVehicleInactive(userId: String, vehicleId: String) {
        val vehicleRef = database.child("users").child(userId).child("vehicles").child(vehicleId)

        vehicleRef.child("vehicle_in_used").setValue(false)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Vehicle $vehicleId set to inactive")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error setting vehicle inactive", error)
            }
    }

    // Fetch the user's name from Firebase
    fun fetchUserName(userId: String, callback: (String?) -> Unit) {
        database.child("users").child(userId).child("name")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val name = snapshot.getValue(String::class.java)
                    callback(name)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseHelper", "Error fetching name", error.toException())
                    callback(null)
                }
            })
    }

    // Function to get total distance from Firebase
    fun getTotalDistance(userId: String, currentVehicleId: String, callback: (Double?) -> Unit) {
        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child("totalDistance")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val totalDistance = snapshot.getValue(Double::class.java)
                    callback(totalDistance)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseHelper", "Error fetching total distance", error.toException())
                    callback(null)
                }
            })
    }

    // Save total distance to Firebase
    fun saveTotalDistance(
        userId: String,
        currentVehicleId: String,
        totalDistance: Double,
        callback: ((Boolean) -> Unit)? = null
    ) {
        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child("totalDistance")
            .setValue(totalDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Total distance updated successfully")
                callback?.invoke(true)  // Invoke callback only if it's not null
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating total distance", error)
                callback?.invoke(false) // Invoke callback only if it's not null
            }
    }


    // Function to get total highway distance from Firebase
    fun getTotalHighwayDistance(
        userId: String,
        currentVehicleId: String,
        callback: (Double?) -> Unit
    ) {
        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child("totalHighwayDistance")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val totalHighwayDistance = snapshot.getValue(Double::class.java)
                    callback(totalHighwayDistance)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e(
                        "FirebaseHelper",
                        "Error fetching total highway distance",
                        error.toException()
                    )
                    callback(null)
                }
            })
    }

    // Save total highway distance to Firebase
    fun saveTotalHighwayDistance(
        userId: String,
        currentVehicleId: String,
        totalHighwayDistance: Double
    ) {
        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child("totalHighwayDistance")
            .setValue(totalHighwayDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Total highway distance updated successfully")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating total highway distance", error)
            }
    }

    // Save today's total distance to Firebase
    fun saveTodayTotalDistance(
        userId: String,
        currentVehicleId: String,
        todayTotalDistance: Double
    ) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child(currentDate).child("todayTotalDistance").setValue(todayTotalDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Today's total distance updated successfully")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating today's total distance", error)
            }
    }

    // Save today's total highway distance to Firebase
    fun saveTodayTotalHighwayDistance(
        userId: String,
        currentVehicleId: String,
        todayTotalHighwayDistance: Double
    ) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child(currentDate).child("todayTotalHighwayDistance")
            .setValue(todayTotalHighwayDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Today's total highway distance updated successfully")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating today's total highway distance", error)
            }
    }

    // Get today's total distance from Firebase
    fun getTodayTotalDistance(
        userId: String,
        currentVehicleId: String,
        callback: (Double?) -> Unit
    ) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child(currentDate).child("todayTotalDistance")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val todayTotalDistance = snapshot.getValue(Double::class.java)
                    callback(todayTotalDistance)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e(
                        "FirebaseHelper",
                        "Error fetching today's total distance",
                        error.toException()
                    )
                    callback(null)
                }
            })
    }

    // Get today's total highway distance from Firebase
    fun getTodayTotalHighwayDistance(
        userId: String,
        currentVehicleId: String,
        callback: (Double?) -> Unit
    ) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates").child(currentVehicleId)
            .child(currentDate).child("todayTotalHighwayDistance")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val todayTotalHighwayDistance = snapshot.getValue(Double::class.java)
                    callback(todayTotalHighwayDistance)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e(
                        "FirebaseHelper",
                        "Error fetching today's total highway distance",
                        error.toException()
                    )
                    callback(null)
                }
            })
    }

    // Save latitude and longitude to Firebase
    fun saveLocation(
        userId: String,
        currentVehicleId: String,
        latitude: Double,
        longitude: Double,
        isOnHighway: Boolean
    ) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        val currentTime = timeFormatter.format(Date())

        val timeNode =
            database.child("location").child(userId).child("coordinates").child(currentVehicleId)
                .child(currentDate).child(currentTime)

        timeNode.child("latitude").setValue(latitude)
        timeNode.child("longitude").setValue(longitude)
        timeNode.child("isOnHighway").setValue(isOnHighway)
            .addOnSuccessListener {
                Log.d(
                    "FirebaseHelper",
                    "Location saved successfully: Lat: $latitude, Long: $longitude, Highway: $isOnHighway"
                )
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error saving location", error)
            }
    }

    fun saveOverSpeedPenalty(
        userId: String,
        currentLocation: Location,
        speed: Double,
        vehicle_id: String?
    ) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        val currentTime = timeFormatter.format(Date())

        val penaltyData = mapOf(
            "timestamp" to currentTime,
            "lat" to currentLocation.latitude,
            "lon" to currentLocation.longitude,
            "speed" to speed,
            "penalty_charge" to 100,
            "penalty_paid" to false,
            "penalty_type" to "overspeed",
            "vehicle_id" to vehicle_id
        )

        database.child("penalties").child(userId).child(currentDate).child(currentTime)
            .setValue(penaltyData)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Overspeed penalty recorded successfully: $penaltyData")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error recording overspeed penalty", error)
            }
    }
}
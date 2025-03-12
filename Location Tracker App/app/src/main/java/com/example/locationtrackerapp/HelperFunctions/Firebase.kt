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
    fun fetchVehiclesFromFirebase(
        callback: (List<String>) -> Unit
    ) {
        val userId = FirebaseAuth.getInstance().currentUser?.uid ?: return

        database.child("users").child(userId).child("vehicles")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val vehicleList = mutableListOf<String>()
                    vehicleList.add("Select Vehicle")

                    for (vehicleSnapshot in snapshot.children) {
                        val vehicleId = vehicleSnapshot.key

                        // Explicitly check if vehicleId is null
                        if (vehicleId == null) {
                            Log.w("VehicleFetch", "Skipping null vehicle ID")
                            continue // Skip to the next iteration if it's null
                        }

                        // Also check if it's blank or empty
                        if (vehicleId.isBlank()) {
                            Log.w("VehicleFetch", "Skipping blank vehicle ID")
                            continue
                        }

                        val vehicleInUse = vehicleSnapshot.child("vehicleInUsed").getValue(Boolean::class.java) ?: false
                        if (!vehicleInUse) {
                            vehicleList.add(vehicleId)
                        }
                    }

                    Log.d("VehicleFetch", "Final Vehicle List: $vehicleList")
                    callback(vehicleList)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseHelper", "Error fetching vehicles", error.toException())
                    callback(emptyList())
                }
            })
    }



    fun setVehicleActive(
        userId: String,
        vehicleId: String,
        isActive: Boolean
    ) {
        val vehicleRef = database.child("users").child(userId).child("vehicles").child(vehicleId)

        vehicleRef.child("vehicleInUsed").setValue(isActive)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Vehicle $vehicleId set to active: $isActive")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating vehicle status", error)
            }
    }


    fun setVehicleInactive(
        userId: String,
        vehicleId: String
    ) {
        setVehicleActive(userId, vehicleId, false)
    }


    // Fetch the user's name from Firebase
    fun fetchUserName(
        userId: String,
        callback: (String?) -> Unit
    ) {
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
    fun getTotalDistance(
        userId: String,
        vehicleId: String,
        callback: (Double?) -> Unit
    ) {
        database.child("location").child(userId).child("coordinates").child(vehicleId)
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
        vehicleId: String,
        totalDistance: Double,
        callback: ((Boolean) -> Unit)? = null
    ) {
        database.child("location").child(userId).child("coordinates").child(vehicleId)
            .child("totalDistance")
            .setValue(totalDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Total distance updated successfully")
                callback?.invoke(true)
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating total distance", error)
                callback?.invoke(false)
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


    // Save latitude and longitude to Firebase
    fun saveLocation(
        userId: String,
        vehicleId: String,
        latitude: Double,
        longitude: Double,
        isOnHighway: Boolean,
        isInsideBoundingBox: Boolean
    ) {
        val currentDate = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault()).format(Date())
        val currentTime = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())

        val highwayStatus = when {
            isOnHighway && isInsideBoundingBox -> 2
            isOnHighway -> 1
            else -> 0
        }

        val timeNode = database.child("location").child(userId).child("coordinates").child(vehicleId)
            .child(currentDate).child(currentTime)

        timeNode.child("latitude").setValue(latitude)
        timeNode.child("longitude").setValue(longitude)
        timeNode.child("isOnHighway").setValue(highwayStatus)
            .addOnSuccessListener {
                Log.d(
                    "FirebaseHelper",
                    "Location saved successfully: Lat: $latitude, Long: $longitude, Highway: $isOnHighway, InsideBox: $isInsideBoundingBox"
                )
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error saving location", error)
            }
    }

    // Save overspeed penalty to Firebase
    fun saveOverSpeedPenalty(
        userId: String,
        location: Location,
        speed: Double,
        speedLimit: Int,
        vehicleId: String?,
    ) {
        val currentDate = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault()).format(Date())
        val currentTime = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())

        val penaltyData = mapOf(
            "timeStamp" to currentTime,
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "speed" to speed,
            "speedLimit" to speedLimit,
            "penaltyCharge" to 100,
            "penaltyPaid" to false,
            "penaltyType" to "overSpeed",
            "vehicleId" to vehicleId,
            "emailSent" to false,
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
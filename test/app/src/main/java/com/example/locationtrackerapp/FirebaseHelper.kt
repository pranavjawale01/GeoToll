package com.example.locationtrackerapp

import android.util.Log
import com.google.firebase.database.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

object FirebaseHelper {

    private lateinit var database: DatabaseReference

    // Fetch the user's name from Firebase
    fun fetchUserName(userId: String, callback: (String?) -> Unit) {
        database = Firebase.database.reference
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

    // Save data to Firebase (e.g., total distance)
    fun saveTotalDistance(userId: String, totalDistance: Double) {
        // Ensure that the locations node exists
        database = Firebase.database.reference
        ensureLocationsNodeExists(userId) {
            database.child("locations").child(userId).child("totalDistance")
                .setValue(totalDistance)
                .addOnSuccessListener {
                    Log.d("FirebaseHelper", "Total distance updated successfully")
                }
                .addOnFailureListener { error ->
                    Log.e("FirebaseHelper", "Error updating total distance", error)
                }
        }
    }

    // Function to save latitude and longitude to Firebase
    fun saveLocation(userId: String, latitude: Double, longitude: Double) {
        database = Firebase.database.reference
        ensureLocationsNodeExists(userId) {
            val locationData = HashMap<String, Any>()
            locationData["latitude"] = latitude
            locationData["longitude"] = longitude

            // Push a new location entry to the "coordinates" node under the user's ID
            database.child("locations").child(userId).child("coordinates").push()
                .setValue(locationData)
                .addOnSuccessListener {
                    Log.d("FirebaseHelper", "Location saved successfully: $locationData")
                }
                .addOnFailureListener { error ->
                    Log.e("FirebaseHelper", "Error saving location", error)
                }
        }
    }

    // Function to get total distance from Firebase
    fun getTotalDistance(userId: String, callback: (Double?) -> Unit) {
        database = Firebase.database.reference
        database.child("locations").child(userId).child("totalDistance")
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

    // Ensure that the locations node exists for the user
    private fun ensureLocationsNodeExists(userId: String, onComplete: () -> Unit) {
        database = Firebase.database.reference
        database.child("locations").child(userId).addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!snapshot.exists()) {
                    // Create the locations node if it doesn't exist
                    database.child("locations").child(userId).setValue(HashMap<String, Any>())
                        .addOnCompleteListener {
                            onComplete()
                        }
                } else {
                    onComplete()
                }
            }

            override fun onCancelled(error: DatabaseError) {
                Log.e("FirebaseHelper", "Error checking locations node", error.toException())
                onComplete()
            }
        })
    }
}
package com.example.locationtrackerapp.HelperFunctions

import android.util.Log
import com.google.firebase.database.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

object Firebase {

    private val database: DatabaseReference = Firebase.database.reference

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

    // Save data to Firebase (e.g., total distance)
    fun saveTotalDistance(userId: String, totalDistance: Double) {
        database.child("location").child(userId).child("totalDistance")
            .setValue(totalDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Total distance updated successfully")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating total distance", error)
            }
    }

    // Function to save latitude and longitude to Firebase
    fun saveLocation(userId: String, latitude: Double, longitude: Double) {
        val locationData = HashMap<String, Any>()
        locationData["latitude"] = latitude
        locationData["longitude"] = longitude

        // Push a new location entry to the "coordinates" node under the user's ID
        database.child("location").child(userId).child("coordinates").push()
            .setValue(locationData)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Location saved successfully: $locationData")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error saving location", error)
            }
    }

    // Function to get total distance from Firebase
    fun getTotalDistance(userId: String, callback: (Double?) -> Unit) {
        database.child("location").child(userId).child("totalDistance")
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
}
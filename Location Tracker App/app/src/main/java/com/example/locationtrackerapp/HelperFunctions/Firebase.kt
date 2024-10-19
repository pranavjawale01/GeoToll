package com.example.locationtrackerapp.HelperFunctions

import android.icu.text.SimpleDateFormat
import android.util.Log
import com.google.firebase.database.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.util.Date
import java.util.Locale

object FirebaseHelper {

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

    // Save total distance to Firebase
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

    // Function to get total highway distance from Firebase
    fun getTotalHighwayDistance(userId: String, callback: (Double?) -> Unit) {
        database.child("location").child(userId).child("totalHighwayDistance")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val totalHighwayDistance = snapshot.getValue(Double::class.java)
                    callback(totalHighwayDistance)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseHelper", "Error fetching total highway distance", error.toException())
                    callback(null)
                }
            })
    }

    // Save total highway distance to Firebase
    fun saveTotalHighwayDistance(userId: String, totalHighwayDistance: Double) {
        database.child("location").child(userId).child("totalHighwayDistance")
            .setValue(totalHighwayDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Total highway distance updated successfully")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating total highway distance", error)
            }
    }

    // Save today's total distance to Firebase
    fun saveTodayTotalDistance(userId: String, todayTotalDistance: Double) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates")
            .child(currentDate).child("todayTotalDistance").setValue(todayTotalDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Today's total distance updated successfully")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating today's total distance", error)
            }
    }

    // Save today's total highway distance to Firebase
    fun saveTodayTotalHighwayDistance(userId: String, todayTotalHighwayDistance: Double) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates")
            .child(currentDate).child("todayTotalHighwayDistance").setValue(todayTotalHighwayDistance)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Today's total highway distance updated successfully")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error updating today's total highway distance", error)
            }
    }

    // Get today's total distance from Firebase
    fun getTodayTotalDistance(userId: String, callback: (Double?) -> Unit) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates")
            .child(currentDate).child("todayTotalDistance").addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val todayTotalDistance = snapshot.getValue(Double::class.java)
                    callback(todayTotalDistance)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseHelper", "Error fetching today's total distance", error.toException())
                    callback(null)
                }
            })
    }

    // Get today's total highway distance from Firebase
    fun getTodayTotalHighwayDistance(userId: String, callback: (Double?) -> Unit) {
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        database.child("location").child(userId).child("coordinates")
            .child(currentDate).child("todayTotalHighwayDistance").addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val todayTotalHighwayDistance = snapshot.getValue(Double::class.java)
                    callback(todayTotalHighwayDistance)
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseHelper", "Error fetching today's total highway distance", error.toException())
                    callback(null)
                }
            })
    }

    // Save latitude and longitude to Firebase
    fun saveLocation(userId: String, latitude: Double, longitude: Double, isOnHighway: Boolean) {
        // Get today's date in "dd-MM-yyyy" format
        val dateFormatter = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
        val currentDate = dateFormatter.format(Date())

        // Get the current time in "HH:mm:ss" format
        val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        val currentTime = timeFormatter.format(Date())

        // Save data directly under the time node
        val timeNode = database.child("location").child(userId).child("coordinates").child(currentDate).child(currentTime)

        // Set the values of latitude, longitude, and isOnHighway directly under the time node
        timeNode.child("latitude").setValue(latitude)
        timeNode.child("longitude").setValue(longitude)
        timeNode.child("isOnHighway").setValue(isOnHighway)
            .addOnSuccessListener {
                Log.d("FirebaseHelper", "Location saved successfully: Lat: $latitude, Long: $longitude, Highway: $isOnHighway")
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error saving location", error)
            }
    }
}
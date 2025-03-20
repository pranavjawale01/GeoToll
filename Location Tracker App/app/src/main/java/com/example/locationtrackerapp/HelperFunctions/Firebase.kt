package com.example.locationtrackerapp.HelperFunctions

import android.icu.text.SimpleDateFormat
import android.location.Location
import android.os.Build
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Date
import java.util.Locale

object FirebaseHelper {

    private val database: DatabaseReference = Firebase.database.reference


    /**
     * Fetches a list of available vehicles (not currently in use) from Firebase.
     *
     * @param callback A function that receives a list of vehicle IDs as strings.
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

                        val vehicleInUse =
                            vehicleSnapshot.child("vehicleInUsed").getValue(Boolean::class.java)
                                ?: false
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


    /**
     * Updates the active status of a specific vehicle in Firebase.
     *
     * @param userId The user ID to identify the owner.
     * @param vehicleId The vehicle ID to be updated.
     * @param isActive True if the vehicle is active, false if inactive.
     */
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


    /**
     * Marks a specific vehicle as inactive.
     *
     * @param userId The user ID to identify the owner.
     * @param vehicleId The vehicle ID to be updated.
     */
    fun setVehicleInactive(
        userId: String,
        vehicleId: String
    ) {
        setVehicleActive(userId, vehicleId, false)
    }


    /**
     * Fetches the user's name from Firebase.
     *
     * @param userId The user ID to fetch the name for.
     * @param callback A function to handle the user's name, or null if not found.
     */
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


    /**
     * Retrieves the total distance traveled by a specific vehicle from Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being accessed.
     * @param vehicleId The ID of the vehicle to fetch the total distance for.
     * @param callback A function that handles the result, returning the total distance as a Double or null if an error occurs.
     */
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


    /**
     * Saves the total distance traveled by a specific vehicle to Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being updated.
     * @param vehicleId The ID of the vehicle for which the total distance is being recorded.
     * @param totalDistance The total distance traveled by the vehicle, in kilometers.
     * @param callback An optional callback function that returns `true` if the update is successful, or `false` if it fails.
     *
     * This function updates the "totalDistance" field in the Firebase database.
     * It logs a success message upon completion and calls the callback if provided.
     */
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


    /**
     * Retrieves the total highway distance traveled by a specific vehicle from Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being accessed.
     * @param currentVehicleId The ID of the vehicle for which the total highway distance is being fetched.
     * @param callback A callback function that returns the total highway distance as a Double if the data is available, or `null` if not found or an error occurs.
     *
     * This function queries the "totalHighwayDistance" field from the Firebase database.
     * In case of success, it passes the fetched value to the callback.
     * If the data is unavailable or an error occurs, it logs the error and returns `null` using the callback.
     */
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


    /**
     * Saves the total highway distance traveled by a specific vehicle to Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being updated.
     * @param currentVehicleId The ID of the vehicle for which the total highway distance is being saved.
     * @param totalHighwayDistance The total highway distance (in kilometers) to be stored in Firebase.
     *
     * This function updates the "totalHighwayDistance" field for the specified vehicle in the Firebase database.
     * On a successful update, it logs a confirmation message.
     * If an error occurs during the update, it logs an error message with the exception details.
     */
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


    /**
     * Fetches the total distance traveled by a specific vehicle for the current day from Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being accessed.
     * @param currentVehicleId The ID of the vehicle for which the total distance is being retrieved.
     * @param callback A callback function that returns the total distance (in kilometers) as a Double, or `null` if an error occurs or no data is found.
     *
     * This function generates the current date in the "dd-MM-yyyy" format and queries the Firebase database
     * to retrieve the "todayTotalDistance" value for the specified vehicle.
     * If the data is successfully retrieved, it passes the result to the callback.
     * If an error occurs during the database query, an error message is logged, and the callback is invoked with `null`.
     */
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


    /**
     * Saves the total distance traveled by a specific vehicle for the current day to Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being updated.
     * @param currentVehicleId The ID of the vehicle for which the total distance is being saved.
     * @param todayTotalDistance The total distance traveled by the vehicle on the current day, in kilometers.
     *
     * This function formats the current date using the "dd-MM-yyyy" format and updates the
     * `todayTotalDistance` field in the Firebase database under the appropriate date node.
     *
     * On successful update, a success message is logged.
     * In case of failure, an error message is logged with details of the exception.
     */
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


    /**
     * Fetches the total highway distance traveled by a specific vehicle for the current day from Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being retrieved.
     * @param currentVehicleId The ID of the vehicle for which the total highway distance is being fetched.
     * @param callback A callback function that receives the total highway distance as a Double,
     *                  or `null` if the data is not available or an error occurs.
     *
     * This function formats the current date using the "dd-MM-yyyy" format and queries the
     * `todayTotalHighwayDistance` field under the corresponding date node in the Firebase database.
     *
     * On successful retrieval, the callback function is invoked with the fetched value.
     * If the value does not exist or an error occurs during the database query, the callback is invoked with `null`.
     *
     * Errors are logged using Log.e for debugging purposes.
     */
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


    /**
     * Saves the total highway distance traveled by a specific vehicle for the current day to Firebase.
     *
     * @param userId The ID of the user whose vehicle data is being saved.
     * @param currentVehicleId The ID of the vehicle for which the total highway distance is being recorded.
     * @param todayTotalHighwayDistance The total highway distance traveled by the vehicle for the day in kilometers.
     *
     * This function formats the current date using the "dd-MM-yyyy" format to store the data under
     * the respective date node in Firebase. The data is stored using the `todayTotalHighwayDistance` field.
     *
     * On successful completion, a log message is generated indicating the data was saved successfully.
     * In case of a failure, an error message is logged with details of the exception.
     *
     */
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


    /**
     * Saves the latitude, longitude, and highway status of a vehicle to Firebase under the user's location data.
     *
     * @param userId The unique ID of the user whose location data is being saved.
     * @param vehicleId The unique ID of the vehicle for which the location is being recorded.
     * @param latitude The latitude coordinate of the vehicle's location.
     * @param longitude The longitude coordinate of the vehicle's location.
     * @param isOnHighway A boolean indicating whether the vehicle is on a highway.
     * @param isInsideBoundingBox A boolean indicating whether the vehicle is inside a predefined bounding box.
     *
     * The function determines the `highwayStatus` based on the following conditions:
     * - `2` if the vehicle is both on a highway and inside the bounding box.
     * - `1` if the vehicle is on a highway but outside the bounding box.
     * - `0` if the vehicle is neither on a highway nor inside the bounding box.
     *
     * The data is stored under the following Firebase path:
     * ```
     * /location/{userId}/coordinates/{vehicleId}/{currentDate}/{currentTime}
     * ```
     * Fields stored:
     * - `latitude`: Vehicle's latitude
     * - `longitude`: Vehicle's longitude
     * - `isOnHighway`: Status representing highway presence and bounding box position
     *
     * On successful data storage, a log message is printed with the saved coordinates and status.
     * In case of failure, an error message with the exception details is logged.
     *
     */
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

        val timeNode =
            database.child("location").child(userId).child("coordinates").child(vehicleId)
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

    /**
     * Records an overspeeding penalty to Firebase for a specific user and vehicle.
     *
     * @param userId The unique ID of the user who committed the overspeeding violation.
     * @param location The current location of the vehicle, including latitude and longitude.
     * @param speed The recorded speed of the vehicle at the time of the violation.
     * @param speedLimit The speed limit for the area where the violation occurred.
     * @param vehicleId The ID of the vehicle involved in the violation. Nullable if the vehicle is not identified.
     *
     * The function stores the overspeeding violation details under the following Firebase path:
     * ```
     * /penalties/{userId}/{currentDate}/{currentTime}
     * ```
     *
     * The following information is stored:
     * - `timeStamp`: The exact time of the violation (HH:mm:ss)
     * - `latitude`: The latitude of the violation location
     * - `longitude`: The longitude of the violation location
     * - `speed`: The vehicle's actual speed during the violation
     * - `speedLimit`: The legal speed limit at the location
     * - `penaltyCharge`: The fine amount for the overspeeding violation (default is 100 units)
     * - `penaltyPaid`: A flag indicating whether the penalty has been paid (default is `false`)
     * - `penaltyType`: A label indicating the type of violation (`"overSpeed"`)
     * - `vehicleId`: The ID of the vehicle that was speeding (if available)
     * - `emailSent`: A flag indicating whether an email notification has been sent (default is `false`)
     *
     * On successful recording, a log message is displayed with the penalty details.
     * In case of failure, an error log is recorded with the exception details.
     *
     */
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


    /**
     * Sends the GPS status of a user's device to Firebase.
     *
     * @param userId The unique ID of the user whose GPS status is being reported.
     * @param isGpsWorking A boolean indicating whether the GPS is functioning correctly (`true`) or has failed (`false`).
     *
     * The function stores the GPS status under the following Firebase path:
     * ```
     * /GPSFailed/{userId}/{currentDate}/{currentTime}
     * ```
     *
     * The following information is stored:
     * - `isGpsWorking`: Boolean representing the current GPS status.
     * - `emailSent`: Flag indicating whether an email notification has been sent (default is `false`).
     * - `gpsStatusMessage`: A descriptive message reflecting the GPS status (`"GPS is working fine"` or `"GPS Failed to Operate"`).
     * - `deviceModel`: The device model (retrieved using `Build.MODEL`).
     * - `appVersion`: The application version (retrieved using `BuildConfig.VERSION_NAME`).
     *
     * On successful recording, a log message is displayed with the GPS status and timestamp.
     * In case of failure, an error log is recorded with the exception details.
     *
     */
    fun sendGpsStatusToFirebase(userId: String, isGpsWorking: Boolean) {
        val currentDate = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault()).format(Date())
        val currentTime = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())

        val gpsStatusData = mapOf(
            "isGpsWorking" to isGpsWorking,
            "emailSent" to false,
            "gpsStatusMessage" to if (isGpsWorking) "GPS is working fine" else "GPS Failed to Operate",
            "deviceModel" to Build.MODEL,
            "appVersion" to BuildConfig.VERSION_NAME
        )

        database.child("GPSFailed").child(userId).child(currentDate).child(currentTime)
            .setValue(gpsStatusData)
            .addOnSuccessListener {
                Log.d(
                    "FirebaseHelper",
                    "GPS status recorded successfully for user $userId at $currentTime on $currentDate"
                )
            }
            .addOnFailureListener { error ->
                Log.e("FirebaseHelper", "Error recording GPS status for user $userId", error)
            }
    }

    /**
     * Fetches the bounding box data for a user from Firebase.
     * If the data is not available, it fetches the latitude and longitude from Firebase,
     * calls the Geoapify API to get the bounding box, and stores it in Firebase.
     *
     * @param userId The ID of the user.
     * @param apiKey The API key for the Geoapify service.
     */
    fun getTheBoundingBoxData(userId: String, apiKey: String) {
        val userRef = database.child("users").child(userId)

        // Fetch and process residential address bounding box
        fetchAndProcessBoundingBox(
            userRef.child("residentialAddressData"),
            apiKey,
            onSuccess = { boundingBox ->
                BoundingBoxChecker.residentialAddressBoundingBox = boundingBox
                Log.d(
                    "BoundingBoxChecker",
                    "Residential Bounding Box fetched/processed: $boundingBox"
                )
            },
            onError = { error ->
                Log.e("BoundingBoxChecker", "Error processing residential bounding box", error)
            }
        )

        // Fetch and process permanent address bounding box
        fetchAndProcessBoundingBox(
            userRef.child("permanentAddressData"),
            apiKey,
            onSuccess = { boundingBox ->
                BoundingBoxChecker.permanentAddressBoundingBox = boundingBox
                Log.d(
                    "BoundingBoxChecker",
                    "Permanent Bounding Box fetched/processed: $boundingBox"
                )
            },
            onError = { error ->
                Log.e("BoundingBoxChecker", "Error processing permanent bounding box", error)
            }
        )
    }

    private fun fetchAndProcessBoundingBox(
        addressRef: DatabaseReference,
        apiKey: String,
        onSuccess: (BoundingBoxChecker.BoundingBox) -> Unit,
        onError: (Exception) -> Unit
    ) {
        addressRef.child("boundingBox").addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (snapshot.exists()) {
                    // Bounding box data exists in Firebase
                    val xMin = snapshot.child("xmin").getValue(Double::class.java) ?: 0.0
                    val yMin = snapshot.child("ymin").getValue(Double::class.java) ?: 0.0
                    val xMax = snapshot.child("xmax").getValue(Double::class.java) ?: 0.0
                    val yMax = snapshot.child("ymax").getValue(Double::class.java) ?: 0.0
                    val boundingBox = BoundingBoxChecker.BoundingBox(xMin, yMin, xMax, yMax)
                    onSuccess(boundingBox)
                } else {
                    // Fetch latitude and longitude for the address
                    addressRef.addListenerForSingleValueEvent(object : ValueEventListener {
                        override fun onDataChange(addressSnapshot: DataSnapshot) {
                            val lat = addressSnapshot.child("latitude").getValue(Double::class.java) ?: 0.0
                            val lon = addressSnapshot.child("longitude").getValue(Double::class.java) ?: 0.0

                            // Launch a coroutine to call the suspend function
                            CoroutineScope(Dispatchers.IO).launch {
                                try {
                                    val boundingBox = BoundingBoxChecker.getBoundingBoxGeoapify(lat, lon, apiKey)
                                    onSuccess(boundingBox)
                                    // Save to Firebase
                                    addressRef.child("boundingBox").setValue(boundingBox)
                                } catch (e: Exception) {
                                    onError(e)
                                }
                            }
                        }

                        override fun onCancelled(error: DatabaseError) {
                            onError(error.toException())
                        }
                    })
                }
            }

            override fun onCancelled(error: DatabaseError) {
                onError(error.toException())
            }
        })
    }
}
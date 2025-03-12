package com.example.locationtrackerapp.HelperFunctions

import com.google.firebase.database.*
import okhttp3.*
import org.json.JSONObject

object BoundingBoxChecker {

    private val database: DatabaseReference by lazy {
        FirebaseDatabase.getInstance().reference
    }

    private const val NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse?format=json&lat=%s&lon=%s"

    // Data class to hold bounding box information
    data class BoundingBox(val minLat: Double, val maxLat: Double, val minLon: Double, val maxLon: Double) {
        fun contains(lat: Double, lon: Double): Boolean {
            return lat in minLat..maxLat && lon in minLon..maxLon
        }
    }

    private var permanentBoundingBox: BoundingBox? = null
    private var residentialBoundingBox: BoundingBox? = null

    // Fetch bounding box from Nominatim API
    fun fetchNominatimData(lat: Double, lon: Double): BoundingBox? {
        val client = OkHttpClient()
        val url = NOMINATIM_URL.format(lat, lon)
        val request = Request.Builder().url(url).header("User-Agent", "Mozilla/5.0").build()

        return try {
            val response = client.newCall(request).execute()
            val json = JSONObject(response.body?.string() ?: "{}")

            val boundingBoxArray = json.getJSONArray("boundingbox")
            val minLat = boundingBoxArray.getString(0).toDouble()
            val maxLat = boundingBoxArray.getString(1).toDouble()
            val minLon = boundingBoxArray.getString(2).toDouble()
            val maxLon = boundingBoxArray.getString(3).toDouble()

            BoundingBox(minLat, maxLat, minLon, maxLon)
        } catch (e: Exception) {
            println("Error fetching data: ${e.message}")
            null
        }
    }

    /**
     * Fetches bounding boxes from Firebase for a given user.
     * @param userId The ID of the user.
     * @param onComplete Callback that returns the bounding boxes.
     */
    fun fetchBoundingBoxes(userId: String, onComplete: (BoundingBox?, BoundingBox?) -> Unit) {
        val userRef = database.child("users/$userId")

        userRef.addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val permLat = snapshot.child("permanent_address").child("lat").getValue(Double::class.java)
                val permLon = snapshot.child("permanent_address").child("lon").getValue(Double::class.java)
                val resLat = snapshot.child("residential_address").child("lat").getValue(Double::class.java)
                val resLon = snapshot.child("residential_address").child("lon").getValue(Double::class.java)

                if (permLat != null && permLon != null) {
                    permanentBoundingBox = fetchNominatimData(permLat, permLon)
                    permanentBoundingBox?.let { saveBoundingBoxToFirebase(userId, "permanent_address", "permanent_address_bounding_box", it) }
                }

                if (resLat != null && resLon != null) {
                    residentialBoundingBox = fetchNominatimData(resLat, resLon)
                    residentialBoundingBox?.let { saveBoundingBoxToFirebase(userId, "residential_address", "residential_address_bounding_box", it) }
                }

                onComplete(permanentBoundingBox, residentialBoundingBox)
            }

            override fun onCancelled(error: DatabaseError) {
                onComplete(null, null)
            }
        })
    }

    /**
     * Gets the already stored bounding boxes without fetching new data.
     * @return A pair of Permanent and Residential bounding boxes.
     */
    fun getBoundingBoxes(): Pair<BoundingBox?, BoundingBox?> {
        return Pair(permanentBoundingBox, residentialBoundingBox)
    }

    // Save bounding box data to Firebase
    private fun saveBoundingBoxToFirebase(userId: String, key: String, key1: String, boundingBox: BoundingBox) {
        val bboxRef = database.child("users").child(userId).child(key).child(key1)
        bboxRef.setValue(
            mapOf(
                "minLat" to boundingBox.minLat,
                "maxLat" to boundingBox.maxLat,
                "minLon" to boundingBox.minLon,
                "maxLon" to boundingBox.maxLon
            )
        )
    }

    /**
     * Checks if a given location is inside either the Permanent or Residential bounding box.
     * @param lat Latitude of the location.
     * @param lon Longitude of the location.
     * @return `true` if the location is inside any bounding box, otherwise `false`.
     */
    fun isLocationInsideBoundingBox(lat: Double, lon: Double): Boolean {
        return (permanentBoundingBox?.contains(lat, lon) == true) ||
                (residentialBoundingBox?.contains(lat, lon) == true)
    }
}

fun main() {
    val lat = 18.584676  // Example latitude
    val lon = 73.736077 // Example longitude

    // Fetch bounding box
    val boundingBox = BoundingBoxChecker.fetchNominatimData(lat, lon)

    if (boundingBox != null) {
        println("Bounding Box for ($lat, $lon):")
        println("Min Latitude: ${boundingBox.minLat}")
        println("Max Latitude: ${boundingBox.maxLat}")
        println("Min Longitude: ${boundingBox.minLon}")
        println("Max Longitude: ${boundingBox.maxLon}")
    } else {
        println("Failed to fetch bounding box for ($lat, $lon)")
    }
}
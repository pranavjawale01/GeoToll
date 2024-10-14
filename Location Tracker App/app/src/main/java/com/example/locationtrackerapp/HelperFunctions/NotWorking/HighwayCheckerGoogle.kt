import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import java.io.IOException

object RoadsAPI {

    private const val SNAP_TO_ROADS_URL = "https://roads.googleapis.com/v1/snapToRoads"
    private const val API_KEY = "AIzaSyAflJAGYJSqgvgcAvqIcYtLrbKqJ-SudEU" // Replace with your Google API key

    // Data class to represent the snapped roads response
    data class SnapToRoadsResponse(val snappedPoints: List<SnappedPoint>)

    data class SnappedPoint(val location: Location, val placeId: String)

    data class Location(val latitude: Double, val longitude: Double)

    // Function to snap GPS points to the nearest roads
    fun snapToRoads(points: List<Coordinates>, callback: (List<Coordinates>) -> Unit) {
        // Create a string of points formatted for the API
        val path = points.joinToString("|") { "${it.latitude},${it.longitude}" }
        val requestUrl = "$SNAP_TO_ROADS_URL?path=$path&key=$API_KEY"

        println("API Request URL: $requestUrl")

        val client = OkHttpClient()
        val request = Request.Builder()
            .url(requestUrl)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                println("Error making API request: ${e.message}")
                callback(emptyList()) // Return empty list on failure
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    println("API request failed: ${response.message}")
                    callback(emptyList()) // Return empty list on failure
                    return
                }

                response.body?.let { responseBody ->
                    val responseData = responseBody.string()
                    println("Response Data: $responseData") // Debugging line

                    try {
                        // Use Gson to parse JSON
                        val gson = Gson()
                        val jsonResponse = gson.fromJson(responseData, SnapToRoadsResponse::class.java)

                        // Map the snapped points to Coordinates
                        val snappedCoordinates = jsonResponse.snappedPoints.map {
                            Coordinates(it.location.latitude, it.location.longitude)
                        }
                        callback(snappedCoordinates)
                    } catch (e: Exception) {
                        println("Error parsing JSON: ${e.message}")
                        callback(emptyList()) // Return empty list on parsing error
                    }
                } ?: run {
                    println("No response body, returning empty list")
                    callback(emptyList()) // Return empty list if no response
                }
            }
        })
    }

    // Data class for representing coordinates
    data class Coordinates(val latitude: Double, val longitude: Double)

}

// Testing purpose only
fun main() {
    // Example coordinates
    val points = listOf(
        RoadsAPI.Coordinates(18.604398, 73.752597)
    )

    // Call snapToRoads and handle the result
    RoadsAPI.snapToRoads(points) { snappedPoints ->
        if (snappedPoints.isNotEmpty()) {
            println("Snapped Points:")
            snappedPoints.forEach { println("Lat: ${it.latitude}, Lng: ${it.longitude}") }
        } else {
            println("No points were snapped to roads.")
        }
    }

    // Sleep the main thread to allow time for the async network call to complete
    // You can uncomment the line below if you want to pause the program for the async call to finish
    // Thread.sleep(5000)
}
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import java.io.IOException

object HighwayCheckerMapbox {

    private const val SNAP_TO_ROADS_URL = "https://api.mapbox.com/roads/snap"
    private const val API_KEY = "YOUR_MAPBOX_ACCESS_TOKEN" // Replace with your Mapbox access token

    // Data class to represent the snapped road response
    data class SnapToRoadsResponse(val roads: List<Road>)

    data class Road(val geometry: Geometry, val name: String?)

    data class Geometry(val coordinates: List<List<Double>>) // List of coordinates for the road

    // Function to snap GPS points to the nearest road
    fun snapToRoads(points: List<Coordinates>, callback: (List<Road>) -> Unit) {
        val path = points.joinToString(";") { "${it.longitude},${it.latitude}" }
        val requestUrl = "$SNAP_TO_ROADS_URL?points=$path&access_token=$API_KEY"

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

                        callback(jsonResponse.roads)
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
        HighwayCheckerMapbox.Coordinates(18.604398, 73.752597)
    )

    // Call snapToRoads and handle the result
    HighwayCheckerMapbox.snapToRoads(points) { snappedRoads ->
        if (snappedRoads.isNotEmpty()) {
            println("Snapped Roads:")
            snappedRoads.forEach { road ->
                println("Road Name: ${road.name}")
                println("Road Coordinates: ${road.geometry.coordinates}")
            }
        } else {
            println("No roads were snapped to the provided coordinates.")
        }
    }

    // Sleep the main thread to allow time for the async network call to complete
    // You can uncomment the line below if you want to pause the program for the async call to finish
    // Thread.sleep(5000)
}

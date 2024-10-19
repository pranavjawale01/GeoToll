import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import java.io.IOException

object HighwayCheckerOSM {

    private const val NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/reverse"

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // Data classes for parsing JSON response
    data class NominatimResponse(
        @SerializedName("address") val address: Address,
        @SerializedName("class") val highwayClass: String? = null,
        @SerializedName("name") val name: String? = null
    )

    data class Address(
        @SerializedName("highway") val highway: String? = null,
        @SerializedName("road") val road: String? = null,
        @SerializedName("name") val name: String? = null,
        @SerializedName("ref") val ref: String? = null
    )

    // Function to check if the location is on a highway or expressway
    fun isHighway(coordinates: Coordinates, callback: (Int, String?) -> Unit) {
        val requestUrl = "$NOMINATIM_API_URL?lat=${coordinates.latitude}&lon=${coordinates.longitude}&format=json"

        // Print the constructed API link
        println("API Request URL: $requestUrl")

        val client = OkHttpClient()
        val request = Request.Builder()
            .url(requestUrl)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                println("Error making API request: ${e.message}")
                callback(0, null) // 0 -> API calling failure
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    println("API request failed: ${response.message}")
                    callback(1, null) // 1 -> API request failed
                    return
                }

                response.body?.let { responseBody ->
                    val responseData = responseBody.string()

                    // Print the raw response data for debugging
                    println("Response Data: $responseData") // Debugging line

                    try {
                        // Use Gson to parse JSON
                        val gson = Gson()
                        val jsonResponse = gson.fromJson(responseData, NominatimResponse::class.java)

                        // Check if the address contains a highway
                        jsonResponse.address.highway?.let { highway ->
                            callback(5, highway) // 5 -> It is a highway
                            return
                        }

                        // Check if the road contains "expressway" or "highway"
                        jsonResponse.address.road?.let { road ->
                            val roadLower = road.lowercase()
                            if (roadLower.contains("expressway") || roadLower.contains("highway")) {
                                callback(5, road) // 5 -> It is an expressway or highway
                                return
                            }
                        }

                        // Check if the response class indicates a highway or trunk
                        jsonResponse.highwayClass?.let { classType ->
                            if (classType.equals("highway", ignoreCase = true) || classType.equals("trunk", ignoreCase = true)) {
                                callback(5, jsonResponse.name ?: jsonResponse.address.road) // 5 -> It is a highway or expressway
                                return
                            }
                        }

                        jsonResponse.address.ref?.let { ref ->
                            val prefixes = setOf("nh", "sh", "mh", "msh", "me")
                            if (prefixes.any { ref.lowercase().startsWith(it) }) {
                                callback(5, ref) // 5 -> It is highway based on references
                                return
                            }
                        }

                        // If not a highway, return the road or name for additional information
                        val locationName = jsonResponse.address.name ?: jsonResponse.address.road ?: "Unknown location"
                        callback(4, locationName)  // 4 -> It is not a highway or expressway, return name or road
                    } catch (e: Exception) {
                        println("Error parsing JSON: ${e.message}")
                        callback(2, null) // 2 -> Parsing error
                    }
                } ?: run {
                    println("No response body, returning false")
                    callback(3, null) // 3 -> No response failure
                }
            }
        })
    }
}

// Testing purpose only
fun main() {
    // Example coordinates (Add more coordinates as needed)
    val coordinatesList = listOf(
        HighwayCheckerOSM.Coordinates(18.604398, 73.752597),
        HighwayCheckerOSM.Coordinates(21.45511, 78.20691),
        HighwayCheckerOSM.Coordinates(20.610959, 77.785982),
        HighwayCheckerOSM.Coordinates(18.583761, 73.736149)
    )

    // Iterate through each set of coordinates and check if they are on a highway
    for (coordinates in coordinatesList) {
        HighwayCheckerOSM.isHighway(coordinates) { isOnHighway, highwayInfo ->
            if (isOnHighway == 5) {
                println("Location (${coordinates.latitude}, ${coordinates.longitude}) is on a highway or expressway. Highway info: $highwayInfo")
            } else {
                when (isOnHighway) {
                    0 -> println("API calling failure for (${coordinates.latitude}, ${coordinates.longitude}).")
                    1 -> println("API request failed for (${coordinates.latitude}, ${coordinates.longitude}).")
                    2 -> println("Error parsing JSON response for (${coordinates.latitude}, ${coordinates.longitude}).")
                    3 -> println("No response from API for (${coordinates.latitude}, ${coordinates.longitude}).")
                    4 -> println("Location (${coordinates.latitude}, ${coordinates.longitude}) is not on a highway. Location info: $highwayInfo")
                    else -> println("Unexpected result for (${coordinates.latitude}, ${coordinates.longitude}).")
                }
            }
        }
    }

    // Sleep the main thread to allow time for the async network calls to complete
    // You can adjust this delay based on your network speed
    // Thread.sleep(5000)
}
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import java.io.IOException

object HighwayCheckerPhoton {

    // Photon API endpoint for reverse geocoding
    private const val PHOTON_API_URL = "https://photon.komoot.io/reverse"

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // Data classes for parsing JSON response
    data class PhotonResponse(
        @SerializedName("features") val features: List<Feature>
    )

    data class Feature(
        @SerializedName("properties") val properties: Properties
    )

    data class Properties(
        @SerializedName("street") val street: String? = null,
        @SerializedName("osm_key") val osmKey: String? = null,
        @SerializedName("osm_value") val osmValue: String? = null,
        @SerializedName("name") val name: String? = null
    )

    // Function to check if the location is on a highway or expressway
    fun isHighway(coordinates: Coordinates, callback: (Int, String?) -> Unit) {
        val requestUrl = "$PHOTON_API_URL?lat=${coordinates.latitude}&lon=${coordinates.longitude}"

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
                        val jsonResponse = gson.fromJson(responseData, PhotonResponse::class.java)

                        // Extract relevant information
                        if (jsonResponse.features.isNotEmpty()) {
                            val properties = jsonResponse.features[0].properties

                            // Check if the osm_key or osm_value indicates a highway
                            if (properties.osmKey.equals("highway", ignoreCase = true) ||
                                properties.osmValue.equals("trunk", ignoreCase = true)) {

                                // Check for specific prefixes in the street name or name
                                properties.name?.let { name ->
                                    if (checkHighwayPrefixes(name) || checkHighwayKeywords(name)) {
                                        callback(5, name) // 5 -> It is a highway or expressway
                                        return
                                    }
                                }
                                properties.street?.let { street ->
                                    if (checkHighwayPrefixes(street) || checkHighwayKeywords(street)) {
                                        callback(5, street) // 5 -> It is a highway or expressway
                                        return
                                    }
                                }
                            }

                            // If not a highway, return the street or name for additional information
                            val locationName = properties.name ?: properties.street ?: "Unknown location"
                            callback(4, locationName)  // 4 -> It is not a highway or expressway, return name or street
                        } else {
                            callback(3, null) // 3 -> No valid data in response
                        }
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

    // Function to check if any token in the name starts with the given prefixes
    private fun checkHighwayPrefixes(name: String): Boolean {
        val prefixes = listOf("nh", "sh", "mh", "msh", "me")
        // Tokenize the name by spaces and commas using regular expression
        val tokens = name.split(Regex("[ ,]+"))

        // Check if any token starts with any of the specified prefixes
        return tokens.any { token ->
            prefixes.any { token.startsWith(it, ignoreCase = true) }
        }
    }

    // Function to check for keywords like "highway", "expressway", or "bypass"
    private fun checkHighwayKeywords(name: String): Boolean {
        return name.contains("highway", ignoreCase = true) ||
                name.contains("expressway", ignoreCase = true) ||
                name.contains("bypass", ignoreCase = true)
    }
}

// Testing purpose only
fun main() {
    // Example coordinates (Add more coordinates as needed)
    val coordinatesList = listOf(
        HighwayCheckerPhoton.Coordinates(18.604398, 73.752597), // mumbai - satara highway
        HighwayCheckerPhoton.Coordinates(21.45511, 78.20691),   // NH3S3J, NH353K
        HighwayCheckerPhoton.Coordinates(20.610959, 77.785982), // mumbai - nagpur expressway
        HighwayCheckerPhoton.Coordinates(18.583761, 73.736149), // blue ridge road infront of college gate
        HighwayCheckerPhoton.Coordinates(18.587655, 73.733186), // rajiv gandhi midc road
        HighwayCheckerPhoton.Coordinates(18.594036, 73.732343)  // hinjewadi phase 2 road
    )

    // Iterate through each set of coordinates and check if they are on a highway
    for (coordinates in coordinatesList) {
        HighwayCheckerPhoton.isHighway(coordinates) { isOnHighway, highwayInfo ->
            if (isOnHighway == 5) {
                println("Location (${coordinates.latitude}, ${coordinates.longitude}) is on a highway. Highway info: $highwayInfo")
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

        // Sleep for 3 seconds between each request
        Thread.sleep(3000)
    }
}
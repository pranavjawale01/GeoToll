import com.google.gson.Gson
import com.google.gson.JsonObject
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import java.io.IOException

object HighwayCheckerOverpass {

    // URL for the Overpass API
    private const val OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // Function to check if the location is on a highway or expressway
    fun isHighway(coordinates: Coordinates, callback: (Int, String?) -> Unit) {
        // Define the Overpass query to get highway information near the given coordinates
        val query = """
            [out:json];
            (
                way["highway"](around:50, ${coordinates.latitude}, ${coordinates.longitude});
                relation["highway"](around:50, ${coordinates.latitude}, ${coordinates.longitude});
            );
            out body;
            """.trimIndent()

        val client = OkHttpClient()
        val requestBody = RequestBody.create("application/x-www-form-urlencoded".toMediaTypeOrNull(), "data=$query")
        val request = Request.Builder()
            .url(OVERPASS_API_URL)
            .post(requestBody)
            .build()

        // Print the constructed API link
        println("API Request URL: $OVERPASS_API_URL with Query: $query")

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
                        val jsonResponse = gson.fromJson(responseData, JsonObject::class.java)
                        val elements = jsonResponse.getAsJsonArray("elements")

                        // Iterate over elements to check for highway-related data
                        elements?.forEach { element ->
                            val tags = element.asJsonObject.getAsJsonObject("tags")
                            val highwayType = tags?.get("highway")?.asString
                            val name = tags?.get("name")?.asString ?: "Unnamed Road"

                            // If a highway type is found, check if it is a valid highway/expressway
                            if (highwayType != null) {
                                if (checkHighwayType(highwayType) || checkHighwayPrefixes(name)) {
                                    callback(5, name) // 5 -> It is a highway or expressway
                                    return
                                }
                            }
                        }

                        // If not a highway, return "Unknown location" or road name
                        callback(4, "Unknown location")  // 4 -> It is not a highway or expressway
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

    // Function to check if the highway type is considered a highway or expressway
    private fun checkHighwayType(highwayType: String): Boolean {
        val highwayTypes = listOf("motorway", "trunk", "primary")
        return highwayTypes.contains(highwayType)
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
}

// Testing purpose only
fun main() {
    // Example coordinates (Add more coordinates as needed)
    val coordinatesList = listOf(
        HighwayCheckerOverpass.Coordinates(18.604398, 73.752597), // mumbai - satara highway
        HighwayCheckerOverpass.Coordinates(21.45511, 78.20691),   // NH3S3J, NH353K
        HighwayCheckerOverpass.Coordinates(20.610959, 77.785982), // mumbai - nagpur expressway
        HighwayCheckerOverpass.Coordinates(18.583761, 73.736149), // blue ridge road in front of college gate
        // Add more coordinates as needed
    )

    // Iterate through each set of coordinates and check if they are on a highway
    for (coordinates in coordinatesList) {
        HighwayCheckerOverpass.isHighway(coordinates) { isOnHighway, highwayInfo ->
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
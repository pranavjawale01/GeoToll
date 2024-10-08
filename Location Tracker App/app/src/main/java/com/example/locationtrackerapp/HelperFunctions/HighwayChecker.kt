import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import java.io.IOException

object HighwayChecker {

    private const val OVERPASS_API_URL = "http://overpass-api.de/api/interpreter"

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // Data classes for parsing JSON response
    data class OverpassResponse(val elements: List<Element>)

    data class Element(val tags: Tags)

    data class Tags(
        @SerializedName("highway") val highway: String? = null,
        @SerializedName("name") val name: String? = null,
        @SerializedName("ref") val ref: String? = null
    )

    // Function to check if the location is on a highway
    fun isHighway(coordinates: Coordinates, callback: (Boolean, String?) -> Unit) {
        val query = """
            [out:json];
            way(around:10, ${coordinates.latitude}, ${coordinates.longitude})["highway"];
            out body;
        """.trimIndent()

        val requestUrl = "$OVERPASS_API_URL?data=${query.toUrlEncoded()}"

        // Print the constructed API link
        println("API Request URL: $requestUrl")

        val client = OkHttpClient()
        val request = Request.Builder()
            .url(requestUrl)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                println("Error making API request: ${e.message}")
                callback(false, null) // On failure, assume it's not a highway
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    println("API request failed: ${response.message}")
                    callback(false, null) // On error, return false
                    return
                }

                response.body?.let { responseBody ->
                    val responseData = responseBody.string()

                    // Print the raw response data for debugging
                    println("Response Data: $responseData") // Debugging line

                    try {
                        // Use Gson to parse JSON
                        val gson = Gson()
                        val jsonResponse = gson.fromJson(responseData, OverpassResponse::class.java)

                        // Check if any element has a highway tag
                        for (element in jsonResponse.elements) {
                            val tags = element.tags

                            // Check if 'name' contains "highway" or "expressway" (case-insensitive)
                            tags.name?.let { name ->
                                val containsHighway = name.lowercase().split(" ").any { it.contains("highway") || it.contains("expressway") }
                                if (containsHighway) {
                                    callback(true, name) // Pass back the highway name
                                    return
                                }
                            }

                            // Check if 'ref' contains "NH" or "MH" (case-insensitive)
                            tags.ref?.let { ref ->
                                val prefixes = setOf("nh", "sh", "mh", "msh", "me")
                                if (prefixes.any { ref.lowercase().startsWith(it) }) {
                                    callback(true, ref) // Pass back the highway ref
                                    return
                                }
                            }
                        }

                        // If no matching highway found
                        callback(false, null)
                    } catch (e: Exception) {
                        println("Error parsing JSON: ${e.message}")
                        callback(false, null) // Handle parsing error
                    }
                } ?: run {
                    println("No response body, returning false")
                    callback(false, null) // No response body, return false
                }
            }
        })
    }

    // Helper function to URL encode the query
    private fun String.toUrlEncoded(): String {
        return this.replace(" ", "%20")
            .replace("\n", "%0A")
            .replace("=", "%3D")
            .replace("&", "%26")
    }
}



// Testing purpose only  -- don't remove the commented code



fun main() {
    // Example coordinates (Change this to test with different coordinates)
    val coordinates = HighwayChecker.Coordinates(18.604398, 73.752597)

    // Call isHighway and handle the callback
    HighwayChecker.isHighway(coordinates) { isOnHighway, highwayInfo ->
        if (isOnHighway) {
            println("Location is on a highway. Highway info: $highwayInfo")
        } else {
            println("Location is not on a highway.")
        }
    }

    // Sleep the main thread to allow time for the async network call to complete
    // You can adjust this delay based on your network speed
    Thread.sleep(5000)
}

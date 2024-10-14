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
    fun isHighway(coordinates: Coordinates, callback: (Int, String?) -> Unit) {
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
                        val jsonResponse = gson.fromJson(responseData, OverpassResponse::class.java)

                        // Check if any element has a highway tag
                        for (element in jsonResponse.elements) {
                            val tags = element.tags

                            // Check if 'name' contains "highway" or "expressway" (case-insensitive)
                            tags.name?.let { name ->
                                val containsHighway = name.lowercase().split(" ").any { it.contains("highway") || it.contains("expressway") }
                                if (containsHighway) {
                                    callback(5, name) // 5 -> It is highway based on naming
                                    return
                                }
                            }

                            // Check if 'ref' contains "NH" or "MH" (case-insensitive)
                            tags.ref?.let { ref ->
                                val prefixes = setOf("nh", "sh", "mh", "msh", "me")
                                if (prefixes.any { ref.lowercase().startsWith(it) }) {
                                    callback(6, ref) // 6 -> It is highway based on references
                                    return
                                }
                            }
                        }

                        callback(4, null)  // 4 -> It is not a highway
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

    // Helper function to URL encode the query
    private fun String.toUrlEncoded(): String {
        return this.replace(" ", "%20")
            .replace("\n", "%0A")
            .replace("=", "%3D")
            .replace("&", "%26")
    }
}

// Testing purpose only
fun main() {
    // Example coordinates (Change this to test with different coordinates)
    val coordinates = HighwayChecker.Coordinates(18.604398, 73.752597)

    // Call isHighway and handle the callback
    HighwayChecker.isHighway(coordinates) { isOnHighway, highwayInfo ->
        if (isOnHighway == 5 || isOnHighway == 6) {
            println("Location is on a highway. Highway info: $highwayInfo")
        } else {
            when (isOnHighway) {
                0 -> println("API calling failure.")
                1 -> println("API request failed.")
                2 -> println("Error parsing JSON response.")
                3 -> println("No response from API.")
                4 -> println("Location is not on a highway.")
                else -> println("Unexpected result.")
            }
        }
    }

    // Sleep the main thread to allow time for the async network call to complete
    // You can adjust this delay based on your network speed
    // Thread.sleep(5000)
}
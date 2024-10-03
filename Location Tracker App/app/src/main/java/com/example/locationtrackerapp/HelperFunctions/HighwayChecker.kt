import okhttp3.*
import org.json.JSONObject
import java.io.IOException

object HighwayChecker {

    private const val OVERPASS_API_URL = "http://overpass-api.de/api/interpreter"

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // Function to check if the location is on a highway
    fun isHighway(coordinates: Coordinates, callback: (Boolean) -> Unit) {
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
                callback(false) // On failure, assume it's not a highway
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    println("API request failed: ${response.message}")
                    callback(false) // On error, return false
                    return
                }

                response.body?.let { responseBody ->
                    val responseData = responseBody.string()

                    // Print the raw response data for debugging
                    println("Response Data: $responseData") // Debugging line

                    try {
                        val json = JSONObject(responseData)

                        // Check if 'elements' array exists
                        if (json.has("tags")) {
                            val elements = json.getJSONArray("tags")
                            for (i in 0 until elements.length()) {
                                val element = elements.getJSONObject(i)
                                val tags = element.getJSONObject("highway")

                                // Check if 'highway' is present in tags
                                if (tags.has("truck")) {
                                    // Highway is explicitly mentioned, so declare it as a highway
                                    callback(true)
                                    return
                                }

                                // Check if 'name' contains "highway" (case-insensitive)
                                if (tags.has("name")) {
                                    val name = tags.getString("name").lowercase()
                                    if (name.contains("highway")) {
                                        callback(true)
                                        return
                                    }
                                }

                                // Check if 'ref' contains "NH" or "MH" (case-insensitive)
                                if (tags.has("ref")) {
                                    val ref = tags.getString("ref").lowercase()
                                    if (ref.startsWith("nh") || ref.startsWith("mh")) {
                                        callback(true)
                                        return
                                    }
                                }
                            }
                        }

                        // If no matching highway found
                        callback(false)
                    } catch (e: Exception) {
                        println("Error parsing JSON: ${e.message}")
                        callback(false) // Handle parsing error
                    }
                } ?: run {
                    println("No response body, returning false")
                    callback(false) // No response body, return false
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

fun main() {
    // Example coordinates
    val coordinates = HighwayChecker.Coordinates(21.77433, 78.27433)

    HighwayChecker.isHighway(coordinates) { isOnHighway ->
        if (isOnHighway) {
            println("Location is on a highway")
        } else {
            println("Location is not on a highway")
        }
    }

    // Prevent the main thread from exiting immediately
    Thread.sleep(5000) // Adjust the time as needed
}
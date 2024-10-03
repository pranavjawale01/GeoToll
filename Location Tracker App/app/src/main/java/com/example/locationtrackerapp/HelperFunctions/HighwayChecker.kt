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
                    val json = JSONObject(responseData)

                    if (json.has("elements")) {
                        val elements = json.getJSONArray("elements")
                        for (i in 0 until elements.length()) {
                            val element = elements.getJSONObject(i)
                            val tags = element.getJSONObject("tags")

                            if (tags.has("ref")) {
                                val ref = tags.getString("ref")
                                if (ref.startsWith("NH") || ref.startsWith("SH")) {
                                    callback(true)
                                    return
                                }
                            }
                        }
                    }

                    callback(false) // No matching highway found
                } ?: run {
                    callback(false) // No response body, return false
                }
            }
        })
    }

    private fun String.toUrlEncoded(): String {
        return this.replace(" ", "%20")
            .replace("\n", "%0A")
            .replace("=", "%3D")
            .replace("&", "%26")
    }
}

fun main() {
    // Example coordinates
    val coordinates = HighwayChecker.Coordinates(18.588942, 73.758388)

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
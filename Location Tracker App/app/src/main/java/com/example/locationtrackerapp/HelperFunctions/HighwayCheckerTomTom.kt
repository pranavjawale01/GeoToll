import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import java.io.IOException

object HighwayCheckerTomTom {

    // Use your TomTom API key here
    private const val TOMTOM_API_KEY = "YOUR_TOMTOM_API_KEY"
    private const val TOMTOM_API_URL = "https://api.tomtom.com/search/2/reverseGeocode"

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // Data classes for parsing JSON response
    data class TomTomResponse(val addresses: List<Address>)
    data class Address(
        @SerializedName("address") val address: AddressDetails
    )

    data class AddressDetails(
        @SerializedName("streetName") val streetName: String? = null,
        @SerializedName("country") val country: String? = null,
        @SerializedName("municipality") val municipality: String? = null,
        @SerializedName("countrySubdivision") val countrySubdivision: String? = null
    )

    // Function to check if the location is on a highway
    fun isHighway(coordinates: Coordinates, callback: (Int, String?) -> Unit) {
        val requestUrl = "$TOMTOM_API_URL/${coordinates.latitude},${coordinates.longitude}.json?key=$TOMTOM_API_KEY"

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
                        val jsonResponse = gson.fromJson(responseData, TomTomResponse::class.java)

                        // Check if any address contains a highway
                        if (jsonResponse.addresses.isNotEmpty()) {
                            val addressDetails = jsonResponse.addresses[0].address
                            addressDetails.streetName?.let { streetName ->
                                if (streetName.contains("highway", ignoreCase = true) || streetName.contains("expressway", ignoreCase = true)) {
                                    callback(5, streetName) // 5 -> It is highway based on naming
                                    return
                                }
                            }
                        }

                        callback(4, null) // 4 -> It is not a highway
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
    val coordinates = HighwayCheckerTomTom.Coordinates(18.604398, 73.752597)

    // Call isHighway and handle the callback
    HighwayCheckerTomTom.isHighway(coordinates) { isOnHighway, highwayInfo ->
        if (isOnHighway == 5) {
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
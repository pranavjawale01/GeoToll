package com.example.locationtrackerapp.HelperFunctions.NotWorking

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import java.io.IOException

object HighwayCheckerOpenCage {

    private const val OPENCAGE_API_URL = "https://api.opencagedata.com/geocode/v1/json"
    private const val API_KEY = "YOUR_API_KEY" // Replace with your actual OpenCage API key

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // Data classes for parsing JSON response
    data class OpenCageResponse(
        @SerializedName("results") val results: List<Result>
    )

    data class Result(
        @SerializedName("components") val components: Components,
        @SerializedName("formatted") val formatted: String? = null
    )

    data class Components(
        @SerializedName("road") val road: String? = null,
        @SerializedName("highway") val highway: String? = null,
        @SerializedName("class") val highwayClass: String? = null
    )

    // Function to check if the location is on a highway or expressway
    fun isHighway(coordinates: Coordinates, callback: (Int, String?) -> Unit) {
        val requestUrl = "$OPENCAGE_API_URL?q=${coordinates.latitude}+${coordinates.longitude}&key=$API_KEY&pretty=1"

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
                        val jsonResponse = gson.fromJson(responseData, OpenCageResponse::class.java)

                        // Check the first result's components for highway-related data
                        jsonResponse.results.firstOrNull()?.components?.let { components ->
                            val highwayName = components.highway ?: components.road

                            // If a highway or expressway is identified
                            if (components.highwayClass.equals("highway", ignoreCase = true) ||
                                components.highwayClass.equals("trunk", ignoreCase = true)) {

                                highwayName?.let { name ->
                                    // Check if the name starts with any specified prefixes
                                    if (checkHighwayPrefixes(name)) {
                                        callback(5, name) // 5 -> It is a highway or expressway
                                        return
                                    }
                                    // Check if the name contains "highway" or "expressway"
                                    if (name.contains("highway", ignoreCase = true) ||
                                        name.contains("expressway", ignoreCase = true) ||
                                        name.contains("bypass", ignoreCase = true)) {
                                        callback(5, name) // 5 -> It is a highway or expressway
                                        return
                                    }
                                }
                            }

                            // If not a highway, return the road or formatted name for additional information
                            val locationName = highwayName ?: "Unknown location"
                            callback(4, locationName)  // 4 -> It is not a highway or expressway, return name or road
                        } ?: run {
                            callback(3, null) // 3 -> No response data
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
}

// Testing purpose only
fun main() {
    // Example coordinates (Add more coordinates as needed)
    val coordinatesList = listOf(
        HighwayCheckerOpenCage.Coordinates(18.604398, 73.752597), // mumbai - satara highway
        HighwayCheckerOpenCage.Coordinates(21.45511, 78.20691),   // NH3S3J, NH353K
        HighwayCheckerOpenCage.Coordinates(20.610959, 77.785982), // mumbai - nagpur expressway
        HighwayCheckerOpenCage.Coordinates(18.583761, 73.736149), // blue ridge road infront of college gate
        HighwayCheckerOpenCage.Coordinates(18.587655, 73.733186), // rajiv gandhi midc road
        HighwayCheckerOpenCage.Coordinates(18.594036, 73.732343), // hinjewadi phase 2 road
        HighwayCheckerOpenCage.Coordinates(18.591329, 73.738909), // shivaji chowk phase 1
        HighwayCheckerOpenCage.Coordinates(18.591911, 73.739046), // dange chowk road
        HighwayCheckerOpenCage.Coordinates(18.591227, 73.739580), // hinjewadi wakad road
        HighwayCheckerOpenCage.Coordinates(18.590696, 73.740674), // sakhre wasti road
        HighwayCheckerOpenCage.Coordinates(18.591126, 73.739491), // hinjewadi road towards phase 1
        HighwayCheckerOpenCage.Coordinates(18.589931, 73.738504), // hinjewadi phase 1 road
        HighwayCheckerOpenCage.Coordinates(18.585680, 73.738451), // road behind college
        HighwayCheckerOpenCage.Coordinates(18.587185, 73.740398), // planet 9 road near mess
        HighwayCheckerOpenCage.Coordinates(18.579922, 73.736281), // blue ridge society road
        HighwayCheckerOpenCage.Coordinates(18.574382, 73.740696), // blue ridge approach road near mula river
        HighwayCheckerOpenCage.Coordinates(18.585342, 73.732584), // maan road near circle
        HighwayCheckerOpenCage.Coordinates(18.592099, 73.755593), // nh4 bypass road near wakad
        HighwayCheckerOpenCage.Coordinates(18.591988, 73.756435), // hinjewadi flyover
        HighwayCheckerOpenCage.Coordinates(18.592831, 73.756623), // service road near highway wakad
        HighwayCheckerOpenCage.Coordinates(18.604854, 73.751468), // hinjewadi chinchwad road
        HighwayCheckerOpenCage.Coordinates(18.608150, 73.751145), // katraj dehu road
        HighwayCheckerOpenCage.Coordinates(18.575254, 73.763714), // exit to banner
        HighwayCheckerOpenCage.Coordinates(18.574984, 73.764610), // balewadi road
        HighwayCheckerOpenCage.Coordinates(18.575823, 73.763323), // katraj dehu bypass near banner with nh48
        HighwayCheckerOpenCage.Coordinates(18.485160, 73.798416), // warje road
        HighwayCheckerOpenCage.Coordinates(
            18.382143,
            73.855580
        )  // pune bengaluru highway start just outside pune
    )

    // Iterate through each set of coordinates and check if they are on a highway
    for (coordinates in coordinatesList) {
        HighwayCheckerOpenCage.isHighway(coordinates) { isOnHighway, highwayInfo ->
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
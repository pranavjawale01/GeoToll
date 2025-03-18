import com.example.locationtrackerapp.HelperFunctions.FirebaseHelper
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

object BoundingBoxChecker {

    data class PermanentAddressBoundingBox(val xMin: Double, val yMin: Double, val xMax: Double, val yMax: Double)
    data class ResidentialAddressBoundingBox(val xMin: Double, val yMin: Double, val xMax: Double, val yMax: Double)
    data class Coordinates(val lat: Double, val lon: Double)

    fun getBoundingBox(userId: String) {
        val apiKey = "6dc7fb95a3b246cfa0f3bcef5ce9ed9a"

        // Check and save permanent address bounding box
        val permanentCoordinates = FirebaseHelper.getPermanentAddressCoordinates(userId)
        val existingPermanentBoundingBox = FirebaseHelper.getBoundingBox(userId, "permanentAddress")

        val permanentBoundingBox = existingPermanentBoundingBox?.let {
            PermanentAddressBoundingBox(it.xMin, it.yMin, it.xMax, it.yMax)
        } ?: run {
            val boundingBox = BoundingBox.getBoundingBoxGeoapify(permanentCoordinates.lat, permanentCoordinates.lon, apiKey)
            val permanentAddressBoundingBox = PermanentAddressBoundingBox(boundingBox.xMin, boundingBox.yMin, boundingBox.xMax, boundingBox.yMax)
            FirebaseHelper.checkAndSaveBoundingBox(userId, "permanentAddress", permanentAddressBoundingBox)
            permanentAddressBoundingBox
        }

        // Check and save residential address bounding box
        val residentialCoordinates = FirebaseHelper.getResidentialAddressCoordinates(userId)
        val existingResidentialBoundingBox = FirebaseHelper.getBoundingBox(userId, "residentialAddress")

        val residentialBoundingBox = existingResidentialBoundingBox?.let {
            ResidentialAddressBoundingBox(it.xMin, it.yMin, it.xMax, it.yMax)
        } ?: run {
            val boundingBox = BoundingBox.getBoundingBoxGeoapify(residentialCoordinates.lat, residentialCoordinates.lon, apiKey)
            val residentialAddressBoundingBox = ResidentialAddressBoundingBox(boundingBox.xMin, boundingBox.yMin, boundingBox.xMax, boundingBox.yMax)
            FirebaseHelper.checkAndSaveBoundingBox(userId, "residentialAddress", residentialAddressBoundingBox)
            residentialAddressBoundingBox
        }
    }

    fun isCoordinateInsideBoundingBox(latitude: Double, longitude: Double, permanentBoundingBox: PermanentAddressBoundingBox, residentialBoundingBox: ResidentialAddressBoundingBox): Boolean {
        val insidePermanent = latitude in permanentBoundingBox.yMin..permanentBoundingBox.yMax && longitude in permanentBoundingBox.xMin..permanentBoundingBox.xMax
        val insideResidential = latitude in residentialBoundingBox.yMin..residentialBoundingBox.yMax && longitude in residentialBoundingBox.xMin..residentialBoundingBox.xMax

        return insidePermanent || insideResidential
    }
}

object BoundingBox {

    data class BoundingBox(val xMin: Double, val yMin: Double, val xMax: Double, val yMax: Double)

    fun getBoundingBoxGeoapify(lat: Double, lon: Double, apiKey: String): BoundingBox {
        val urlString = "https://api.geoapify.com/v1/geocode/reverse?lat=$lat&lon=$lon&format=json&type=city&apiKey=$apiKey"

        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection

        connection.requestMethod = "GET"

        val responseCode = connection.responseCode
        if (responseCode == HttpURLConnection.HTTP_OK) {
            val response = connection.inputStream.bufferedReader().use { it.readText() }
            val jsonResponse = JSONObject(response)

            val results = jsonResponse.optJSONArray("results")
            if (results != null && results.length() > 0) {
                val result = results.getJSONObject(0)
                println("API Response: $result")

                if (result.has("bbox")) {
                    val bbox = result.getJSONObject("bbox")
                    val boundingBox = BoundingBox(
                        xMin = bbox.getDouble("lon1"),
                        yMin = bbox.getDouble("lat1"),
                        xMax = bbox.getDouble("lon2"),
                        yMax = bbox.getDouble("lat2")
                    )
                    println("Bounding Box (xMin, yMin, xMax, yMax): $boundingBox")
                    return boundingBox
                } else {
                    throw Exception("Bounding box not available for the provided coordinates.")
                }
            } else {
                throw Exception("No results found for the coordinates.")
            }
        } else {
            throw Exception("API Error: $responseCode")
        }
    }
}

fun main() {
    val latitude = 12.365068
    val longitude = 76.603595
    val apiKey = "6dc7fb95a3b246cfa0f3bcef5ce9ed9a" // Replace with your actual API key

    try {
        val boundingBox = BoundingBox.getBoundingBoxGeoapify(latitude, longitude, apiKey)
        println("Bounding Box: $boundingBox")
    } catch (e: Exception) {
        println("Error: ${e.message}")
    }
}
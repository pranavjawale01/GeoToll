import com.example.locationtrackerapp.HelperFunctions.FirebaseHelper
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import kotlinx.coroutines.*

object BoundingBoxChecker {

    data class BoundingBox(val xMin: Double, val yMin: Double, val xMax: Double, val yMax: Double)

    data class Coordinates(val lat: Double, val lon: Double)

    private var permanentBoundingBox: BoundingBox? = null
    private var residentialBoundingBox: BoundingBox? = null

    fun getBoundingBox(userId: String) {
        val apiKey = "6dc7fb95a3b246cfa0f3bcef5ce9ed9a" // Use a secure way to store API keys

        // Permanent Address
        val permanentCoordinates = FirebaseHelper.getPermanentAddressCoordinates(userId)
        val existingPermanentBoundingBox = FirebaseHelper.getBoundingBox(userId, "permanentAddress")

        permanentBoundingBox = ((existingPermanentBoundingBox as? JSONObject)?.let { box ->
            BoundingBox(
                box.getDouble("xMin"),
                box.getDouble("yMin"),
                box.getDouble("xMax"),
                box.getDouble("yMax")
            )
        } ?: run {
            val boundingBox = BoundingBoxHelper.getBoundingBoxGeoapify(permanentCoordinates.lat, permanentCoordinates.lon, apiKey)
            FirebaseHelper.checkAndSaveBoundingBox(userId, "permanentAddress", boundingBox)
            boundingBox
        }) as BoundingBox?


        // Residential Address
        val residentialCoordinates = FirebaseHelper.getResidentialAddressCoordinates(userId)
        val existingResidentialBoundingBox = FirebaseHelper.getBoundingBox(userId, "residentialAddress")

        residentialBoundingBox = ((existingResidentialBoundingBox as? JSONObject)?.let { box ->
            BoundingBox(
                box.getDouble("xMin"),
                box.getDouble("yMin"),
                box.getDouble("xMax"),
                box.getDouble("yMax")
            )
        } ?: run {
            val boundingBox = BoundingBoxHelper.getBoundingBoxGeoapify(residentialCoordinates.lat, residentialCoordinates.lon, apiKey)
            FirebaseHelper.checkAndSaveBoundingBox(userId, "residentialAddress", boundingBox)
            boundingBox
        }) as BoundingBox?
    }

    fun isCoordinateInsideBoundingBox(latitude: Double, longitude: Double): Boolean {
        val insidePermanent = permanentBoundingBox?.let {
            latitude in it.yMin..it.yMax && longitude in it.xMin..it.xMax
        } ?: false

        val insideResidential = residentialBoundingBox?.let {
            latitude in it.yMin..it.yMax && longitude in it.xMin..it.xMax
        } ?: false

        return insidePermanent || insideResidential
    }
}

object BoundingBoxHelper {

    data class BoundingBox(val xMin: Double, val yMin: Double, val xMax: Double, val yMax: Double)

    fun getBoundingBoxGeoapify(lat: Double, lon: Double, apiKey: String): BoundingBox {
        val urlString = "https://api.geoapify.com/v1/geocode/reverse?lat=$lat&lon=$lon&format=json&type=city&apiKey=$apiKey"
        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"

        return try {
            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val response = connection.inputStream.bufferedReader().use { it.readText() }
                val jsonResponse = JSONObject(response)

                val results = jsonResponse.optJSONArray("results")
                if (results != null && results.length() > 0) {
                    val result = results.getJSONObject(0)
                    println("API Response: $result")

                    val bbox = result.optJSONObject("bbox") ?: throw Exception("Bounding box not available.")
                    BoundingBox(
                        xMin = bbox.getDouble("lon1"),
                        yMin = bbox.getDouble("lat1"),
                        xMax = bbox.getDouble("lon2"),
                        yMax = bbox.getDouble("lat2")
                    ).also {
                        println("Bounding Box (xMin, yMin, xMax, yMax): $it")
                    }
                } else {
                    throw Exception("No results found for the coordinates.")
                }
            } else {
                throw Exception("API Error: $responseCode")
            }
        } finally {
            connection.disconnect()
        }
    }
}

fun main() {
    val latitude = 12.365068
    val longitude = 76.603595
    val apiKey = "6dc7fb95a3b246cfa0f3bcef5ce9ed9a"

    try {
        val boundingBox = BoundingBoxHelper.getBoundingBoxGeoapify(latitude, longitude, apiKey)
        println("Bounding Box: $boundingBox")
    } catch (e: Exception) {
        println("Error: ${e.message}")
    }
}
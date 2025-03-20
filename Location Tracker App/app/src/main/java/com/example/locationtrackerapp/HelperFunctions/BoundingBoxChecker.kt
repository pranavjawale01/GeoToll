import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

object BoundingBoxChecker {

    data class BoundingBox(
        val xmin: Double,
        val ymin: Double,
        val xmax: Double,
        val ymax: Double
    )

    var permanentAddressBoundingBox: BoundingBox? = null
    var residentialAddressBoundingBox: BoundingBox? = null

    private val client = HttpClient(CIO) {
        install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
            })
        }
    }


    suspend fun getBoundingBoxGeoapify(lat: Double, lon: Double, apiKey: String): BoundingBox {
        return try {
            val url = "https://api.geoapify.com/v1/geocode/reverse"
            val params = mapOf(
                "lat" to lat.toString(),
                "lon" to lon.toString(),
                "format" to "json",
                "type" to "city",
                "apiKey" to apiKey
            )

            val response: HttpResponse = withContext(Dispatchers.IO) {
                client.get(url) {
                    url {
                        params.forEach { (key, value) ->
                            parameters.append(key, value)
                        }
                    }
                }
            }

            when (response.status) {
                HttpStatusCode.OK -> {
                    val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
                    val results = json["results"]?.jsonArray

                    if (!results.isNullOrEmpty()) {
                        val result = results[0].jsonObject
                        println("API Response: $result")

                        if (result.containsKey("bbox")) {
                            val bbox = result["bbox"]!!.jsonObject
                            val lon1 = bbox["lon1"]!!.jsonPrimitive.content.toDouble()
                            val lat1 = bbox["lat1"]!!.jsonPrimitive.content.toDouble()
                            val lon2 = bbox["lon2"]!!.jsonPrimitive.content.toDouble()
                            val lat2 = bbox["lat2"]!!.jsonPrimitive.content.toDouble()

                            println("Bounding Box (xMin, yMin, xMax, yMax): ($lon1, $lat1, $lon2, $lat2)")
                            BoundingBox(lon1, lat1, lon2, lat2)
                        } else {
                            throw Exception("Bounding box not available for the provided coordinates.")
                        }
                    } else {
                        throw Exception("No results found for the coordinates.")
                    }
                }
                else -> throw Exception("API Error: ${response.status}, ${response.bodyAsText()}")
            }
        } catch (e: Exception) {
            // Log the exception or handle it as needed
            println("Error: ${e.message}")
            throw e // Re-throw the exception or return a default BoundingBox if applicable
        }
    }

    /**
     * Checks if a given coordinate is inside the residential or permanent address bounding box.
     *
     * @param latitude The latitude of the coordinate.
     * @param longitude The longitude of the coordinate.
     * @return `true` if the coordinate is inside either bounding box, `false` otherwise.
     */
    fun isCoordinateInsideResidentialAddressBoundingBoxOrPermanentAddressBoundingBox(latitude: Double, longitude: Double): Boolean {
        val residentialBox = residentialAddressBoundingBox
        val permanentBox = permanentAddressBoundingBox

        return (residentialBox != null && isCoordinateInsideBoundingBox(latitude, longitude, residentialBox)) ||
                (permanentBox != null && isCoordinateInsideBoundingBox(latitude, longitude, permanentBox))
    }

    /**
     * Checks if a coordinate is inside a bounding box.
     *
     * @param latitude The latitude of the coordinate.
     * @param longitude The longitude of the coordinate.
     * @param boundingBox The bounding box to check against.
     * @return `true` if the coordinate is inside the bounding box, `false` otherwise.
     */
    private fun isCoordinateInsideBoundingBox(latitude: Double, longitude: Double, boundingBox: BoundingBox): Boolean {
        return longitude >= boundingBox.xmin && longitude <= boundingBox.xmax &&
                latitude >= boundingBox.ymin && latitude <= boundingBox.ymax
    }
}

// Example Usage
suspend fun main() {
    val latitude = 12.365068
    val longitude = 76.603595
    val apiKey = "6dc7fb95a3b246cfa0f3bcef5ce9ed9a"

    try {
        val boundingBox = BoundingBoxChecker.getBoundingBoxGeoapify(latitude, longitude, apiKey)
        println(boundingBox)
    } catch (e: Exception) {
        println(e.message)
    }
}
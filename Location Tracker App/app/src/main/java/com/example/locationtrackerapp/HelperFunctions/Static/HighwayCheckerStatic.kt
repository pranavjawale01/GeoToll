import com.example.locationtrackerapp.HelperFunctions.DistanceCalculator
import java.io.File
import kotlin.math.*

object HighwayCheckerStatic {

    // Data class to represent a geographic location
    data class Coordinates(val latitude: Double, val longitude: Double)

    // List to store highway coordinates loaded from the text file
    val highwayCoordinatesList = mutableListOf<Coordinates>()

    // Function to load highway data from a file into the list of coordinates
    fun loadHighwayDataFromFile(filePath: String) {
        val file = File(filePath)
        if (!file.exists()) {
            println("File not found: $filePath")
            return
        }

        file.useLines { lines ->
            lines.forEach { line ->
                // Assuming each line in the file contains: latitude,longitude
                val parts = line.split(",")
                val latitude = parts.getOrNull(0)?.trim()?.toDoubleOrNull()
                val longitude = parts.getOrNull(1)?.trim()?.toDoubleOrNull()

                if (latitude != null && longitude != null) {
                    highwayCoordinatesList.add(Coordinates(latitude, longitude))
                }
            }
        }
        println("Highway data loaded successfully.")
    }

    // Function to check if the given coordinates are close to any highway coordinates
    fun isHighway(coordinates: Coordinates, radiusInMeters: Double = 20.0): Boolean {
        // Check if the distance to any highway coordinate is within the given radius
        return highwayCoordinatesList.asSequence().any { highwayCoordinate ->
            val distance = DistanceCalculator.haversine(
                coordinates.latitude,
                coordinates.longitude,
                highwayCoordinate.latitude,
                highwayCoordinate.longitude
            )
            distance <= radiusInMeters.toBigDecimal()
        }
    }
}

// Testing purpose only
fun main() {
    // Example coordinates to check (You can update this for testing purposes)
    val coordinates = HighwayCheckerStatic.Coordinates(18.578498, 73.737187)

    // Load the static highway data from a file (adjust the file path as needed)
    HighwayCheckerStatic.loadHighwayDataFromFile("app\\src\\main\\java\\com\\example\\locationtrackerapp\\HelperFunctions\\Static\\coordinates.txt")

    // Check if the coordinates are near a highway
    val result = HighwayCheckerStatic.isHighway(coordinates)
    println("Is highway: $result")
}
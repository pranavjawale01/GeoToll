package com.example.locationtrackerapp.HelperFunctions.Static

import java.io.File
import javax.xml.parsers.DocumentBuilderFactory

fun main() {
    // Input and output file paths
    val inputFilePath = "app\\src\\main\\java\\com\\example\\locationtrackerapp\\HelperFunctions\\Static\\GraphHopper-Track-2024-10-14-1km.gpx" // Use absolute path for debugging
    val outputFilePath = "app\\src\\main\\java\\com\\example\\locationtrackerapp\\HelperFunctions\\Static\\coordinates.txt" // Adjust accordingly

    try {
        val inputFile = File(inputFilePath)

        // Check if the file exists
        if (!inputFile.exists()) {
            println("The specified input file does not exist: $inputFilePath")
            return // Exit if file is not found
        }

        // Create a DocumentBuilder
        val dbFactory = DocumentBuilderFactory.newInstance()
        val dBuilder = dbFactory.newDocumentBuilder()
        val doc = dBuilder.parse(inputFile)

        // Normalize the XML structure
        doc.documentElement.normalize()

        // Extract latitude and longitude from each track point
        val trkPoints = doc.getElementsByTagName("trkpt")
        val coordinates = mutableListOf<String>()

        for (i in 0 until trkPoints.length) {
            val trkpt = trkPoints.item(i)
            val lat = trkpt.attributes.getNamedItem("lat").nodeValue
            val lon = trkpt.attributes.getNamedItem("lon").nodeValue
            coordinates.add("$lat, $lon")
        }

        // Write coordinates to the output file
        File(outputFilePath).bufferedWriter().use { out ->
            coordinates.forEach { coordinate ->
                out.write(coordinate)
                out.newLine()
            }
        }

        println("Coordinates extracted and saved to $outputFilePath")
    } catch (e: Exception) {
        println("An error occurred: ${e.message}")
        e.printStackTrace() // Print the stack trace for debugging
    }
}
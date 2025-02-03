package com.example.locationtrackerapp.HelperFunctions

import com.google.gson.JsonParser
import okhttp3.OkHttpClient
import okhttp3.Request
import kotlin.math.*

data class Coordinates(val lat: Double, val lon: Double)
data class CityInfo(val latMin: Double, val latMax: Double, val lonMin: Double, val lonMax: Double, val radius: Double)

fun getCityBoundingBoxAndRadius(cityName: String): CityInfo? {
    val client = OkHttpClient()
    val url = "https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&polygon_geojson=1"

    val request = Request.Builder()
        .url(url)
        .header("User-Agent", "YourAppName")
        .build()

    client.newCall(request).execute().use { response ->
        if (!response.isSuccessful) {
            println("Failed to fetch city data. HTTP Error: ${response.code}")
            return null
        }

        val responseBody = response.body?.string()
        if (responseBody.isNullOrEmpty()) {
            println("Response body is empty.")
            return null
        }

        val json = JsonParser.parseString(responseBody).asJsonArray
        if (json.size() == 0) {
            println("City not found.")
            return null
        }

        val cityDetails = json[0].asJsonObject
        if (!cityDetails.has("boundingbox")) {
            println("Bounding box data not available.")
            return null
        }

        val boundingBox = cityDetails["boundingbox"].asJsonArray
        val latMin = boundingBox[0].asDouble
        val latMax = boundingBox[1].asDouble
        val lonMin = boundingBox[2].asDouble
        val lonMax = boundingBox[3].asDouble

        // Calculate the approximate radius using Haversine formula
        val radius = calculateRadius(latMin, latMax, lonMin, lonMax)

        return CityInfo(latMin, latMax, lonMin, lonMax, radius)
    }
}

fun calculateRadius(latMin: Double, latMax: Double, lonMin: Double, lonMax: Double): Double {
    val earthRadius = 6371.0 // Radius of Earth in kilometers

    val latDistance = Math.toRadians(latMax - latMin)
    val lonDistance = Math.toRadians(lonMax - lonMin)

    val a = sin(latDistance / 2).pow(2.0) + cos(Math.toRadians(latMin)) * cos(Math.toRadians(latMax)) * sin(lonDistance / 2).pow(2.0)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earthRadius * c / 2 // Approximate radius
}

fun isCoordinateInsideBoundingBox(coordinate: Coordinates, cityInfo: CityInfo?): Boolean {
    if (cityInfo == null) {
        println("City information not available.")
        return false
    }

    if (coordinate.lat >= cityInfo.latMin && coordinate.lat <= cityInfo.latMax &&
        coordinate.lon >= cityInfo.lonMin && coordinate.lon <= cityInfo.lonMax) {
        return true
    }
    return false
}

fun main() {
    val cityName = "Pune, Maharashtra"
    val coordinate = Coordinates(lat = 40.7128, lon = -74.0060) // Example: NYC

    val cityInfo = getCityBoundingBoxAndRadius(cityName)

    if (cityInfo != null) {
        println("Bounding Box: [${cityInfo.latMin}, ${cityInfo.latMax}], [${cityInfo.lonMin}, ${cityInfo.lonMax}]")
        println("Approximate Radius: ${"%.2f".format(cityInfo.radius)} km")

        val isInside = isCoordinateInsideBoundingBox(coordinate, cityInfo)
        if (isInside) {
            println("The coordinate is inside $cityName.")
        } else {
            println("The coordinate is not inside $cityName.")
        }
    }
}
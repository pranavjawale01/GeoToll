package com.example.locationtrackerapp

import java.math.BigDecimal
import java.math.RoundingMode
import kotlin.math.*

object DistanceCalculator {
    private val RADIUS_OF_EARTH_METERS = BigDecimal("6371008.8") // Earth's radius in meters

    /**
     * Calculates the distance between two latitude/longitude points using the Haversine formula.
     *
     * @param lat1 Latitude of the first point in degrees.
     * @param lon1 Longitude of the first point in degrees.
     * @param lat2 Latitude of the second point in degrees.
     * @param lon2 Longitude of the second point in degrees.
     * @return Distance in meters.
     */
    fun haversine(lat1: Double, lon1: Double, lat2: Double, lon2: Double): BigDecimal {
        // Convert degrees to radians
        val lat1Rad = Math.toRadians(lat1)
        val lon1Rad = Math.toRadians(lon1)
        val lat2Rad = Math.toRadians(lat2)
        val lon2Rad = Math.toRadians(lon2)

        val dLat = lat2Rad - lat1Rad
        val dLon = lon2Rad - lon1Rad

        val a = sin(dLat / 2).pow(2) +
                cos(lat1Rad) * cos(lat2Rad) * sin(dLon / 2).pow(2)

        val c = 2 * atan2(sqrt(a), sqrt(1 - a))

        // Calculate distance
        return RADIUS_OF_EARTH_METERS.multiply(BigDecimal(c)).setScale(2, RoundingMode.HALF_UP) // Return distance in meters
    }
}
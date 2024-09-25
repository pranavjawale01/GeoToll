package com.example.locationtrackerapp

import android.location.Location

object SpeedCalculator {

    // Function to calculate speed between two locations in km/h
    fun calculateSpeed(previousLocation: Location?, currentLocation: Location): Double {
        if (previousLocation == null) {
            return 0.0 // No speed if no previous location
        }

        val timeDifferenceInSeconds =
            (currentLocation.time - previousLocation.time) / 1000.0 // Time difference in seconds
        if (timeDifferenceInSeconds == 0.0) {
            return 0.0 // Prevent division by zero
        }

        val distanceInMeters = previousLocation.distanceTo(currentLocation) // Distance in meters
        val speedMetersPerSecond = distanceInMeters / timeDifferenceInSeconds // Speed in m/s

        return speedMetersPerSecond * 3.6 // Convert m/s to km/h
    }
}
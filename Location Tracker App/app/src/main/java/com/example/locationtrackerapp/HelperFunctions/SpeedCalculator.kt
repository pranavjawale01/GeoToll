package com.example.locationtrackerapp.HelperFunctions

import android.location.Location

object SpeedCalculator {

    /**
     * Calculates the speed between two locations in kilometers per hour (km/h).
     *
     * This function uses the distance between the previous and current location
     * and the time difference to calculate the speed.
     *
     * @param previousLocation The previous location, or null if no previous location exists.
     * @param currentLocation The current location.
     * @return The calculated speed in km/h. Returns 0.0 if previousLocation is null or time difference is zero.
     */
    fun calculateSpeed(previousLocation: Location?, currentLocation: Location): Double {
        // Return 0 if there is no previous location to compare
        if (previousLocation == null) {
            return 0.0
        }

        // Calculate time difference in seconds
        val timeDifferenceInSeconds = (currentLocation.time - previousLocation.time) / 1000.0
        if (timeDifferenceInSeconds == 0.0) {
            return 0.0 // Prevent division by zero
        }

        // Calculate distance in meters using the Android Location API
        val distanceInMeters = previousLocation.distanceTo(currentLocation)

        // Calculate speed in meters per second (m/s)
        val speedMetersPerSecond = distanceInMeters / timeDifferenceInSeconds

        // Convert speed from m/s to km/h
        return speedMetersPerSecond * 3.6
    }
}
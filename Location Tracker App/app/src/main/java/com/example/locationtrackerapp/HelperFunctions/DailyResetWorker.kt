package com.example.locationtrackerapp.HelperFunctions

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.example.locationtrackerapp.MainActivity
import com.google.firebase.auth.FirebaseAuth

class DailyResetWorker(context: Context, workerParams: WorkerParameters) : Worker(context, workerParams) {

    override fun doWork(): Result {
        // Get the current user
        val user = FirebaseAuth.getInstance().currentUser

        // Get today's distances from the input data
        val todayTotalDistance = inputData.getDouble("todayTotalDistance", 0.0)
        val todayTotalHighwayDistance = inputData.getDouble("todayTotalHighwayDistance", 0.0)

        user?.let {
            // Save today's distances to Firebase
            FirebaseHelper.saveTodayTotalDistance(it.uid, todayTotalDistance)
            FirebaseHelper.saveTodayTotalHighwayDistance(it.uid, todayTotalHighwayDistance)

            // Reset values in MainActivity
            resetValues()
        }

        // Indicate success
        return Result.success()
    }

    private fun resetValues() {
        // Reset the previous location stored in MainActivity
        MainActivity.previousLocation = null
        MainActivity.todayTotalHighwayDistance = 0.0
        MainActivity.todayTotalDistance = 0.0
    }
}
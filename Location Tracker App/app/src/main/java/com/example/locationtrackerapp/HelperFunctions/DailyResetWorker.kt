import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.example.locationtrackerapp.HelperFunctions.FirebaseHelper
import com.example.locationtrackerapp.MainActivity
import com.google.firebase.auth.FirebaseAuth

class DailyResetWorker(context: Context, workerParams: WorkerParameters) : Worker(context, workerParams) {
    override fun doWork(): Result {
        val user = FirebaseAuth.getInstance().currentUser ?: return Result.failure()

        val todayTotalDistanceInput = inputData.getDouble("todayTotalDistance", 0.0)
        val todayTotalHighwayDistanceInput = inputData.getDouble("todayTotalHighwayDistance", 0.0)
        val currentVehicleId = inputData.getString("currentVehicleId") ?: return Result.failure()  // ✅ Added parameter

        FirebaseHelper.getTodayTotalDistance(user.uid, currentVehicleId) { todayTotalDistance ->
            FirebaseHelper.getTodayTotalHighwayDistance(user.uid, currentVehicleId) { todayTotalHighwayDistance ->

                val updatedTotalDistance = (todayTotalDistance ?: 0.0) + todayTotalDistanceInput
                val updatedTotalHighwayDistance = (todayTotalHighwayDistance ?: 0.0) + todayTotalHighwayDistanceInput

                FirebaseHelper.saveTodayTotalDistance(user.uid, currentVehicleId, updatedTotalDistance)
                FirebaseHelper.saveTodayTotalHighwayDistance(user.uid, currentVehicleId, updatedTotalHighwayDistance)

                resetValues()
            }
        }

        return Result.success()
    }

    private fun resetValues() {
        // Consider using SharedPreferences instead of accessing MainActivity directly
        MainActivity.previousLocation = null
        MainActivity.todayTotalHighwayDistance = 0.0
        MainActivity.todayTotalDistance = 0.0
    }
}
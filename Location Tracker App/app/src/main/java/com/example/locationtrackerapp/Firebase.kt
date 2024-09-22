import com.example.locationtrackerapp.Data
import com.google.firebase.database.DatabaseReference

object Firebase {
    private lateinit var database: DatabaseReference
    fun getUserName(name: String) {
        database = Firebase.database.ref
    }

    fun setLatitudeLongitude(uid: String, latitude: String, longitude: String) {
        database = Firebase.database.ref
        val user = Data(uid, latitude, longitude)
    }
}
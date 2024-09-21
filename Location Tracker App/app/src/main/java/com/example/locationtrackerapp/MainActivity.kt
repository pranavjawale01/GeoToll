package com.example.locationtrackerapp

import android.content.Intent
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.TextView
import androidx.activity.ComponentActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.database.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

class MainActivity : ComponentActivity() {

    private lateinit var mp: MediaPlayer
    private lateinit var auth: FirebaseAuth
    private lateinit var button: Button
    private lateinit var nameTextView: TextView
    private lateinit var emailTextView: TextView
    private var user: FirebaseUser? = null
    private lateinit var database: DatabaseReference

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()

        // Initialize UI elements
        button = findViewById(R.id.logout)
        nameTextView = findViewById(R.id.name_text_view)
        emailTextView = findViewById(R.id.user_details)

        // Get current user
        user = auth.currentUser
        if (user == null) {
            navigateToLogin()
        } else {
            emailTextView.text = user?.email
            //nameTextView.text = user?.uid
            fetchUserName(user!!.uid)
        }

        mp = MediaPlayer.create(this, R.raw.app_start)
        mp.start()

        button.setOnClickListener {
            auth.signOut()
            navigateToLogin()
        }
    }

    // Fetch user's name from the database and display it
    private fun fetchUserName(userId: String) {
        database = FirebaseDatabase.getInstance().reference

        database.child("users").child(userId).child("name")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        val name = snapshot.getValue(String::class.java)
                        nameTextView.text = name ?: "Name not found"
                    } else {
                        nameTextView.text = "Name not found"
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    Log.e("MainActivity", "Error fetching name", error.toException())
                    nameTextView.text = "Error fetching name"
                }
            })
    }


    // Navigate to the login screen
    private fun navigateToLogin() {
        val intent = Intent(this, LogIn::class.java)
        startActivity(intent)
        finish()
    }
}
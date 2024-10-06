package com.example.geotoll

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase

class MainActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    lateinit var database : DatabaseReference

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        auth = FirebaseAuth.getInstance()
        database = FirebaseDatabase.getInstance().getReference("Users")

        val userId = findViewById<TextInputEditText>(R.id.etUserNameEditText)
        val userPassword = findViewById<TextInputEditText>(R.id.etPasswordEditText)
        val signInButton = findViewById<Button>(R.id.btnSignIn)

        signInButton.setOnClickListener {
            val username = userId.text.toString()
            val password = userPassword.text.toString()
            /*
            // Fetch user data from Firebase
            database.child(username).get().addOnSuccessListener { snapshot ->
                val dbPassword = snapshot.child("password").value as String
                if (password == dbPassword) {
                    // Authentication successful, move to location access
                    val intent = Intent(this, LocationTrackerActivity::class.java)
                    intent.putExtra("uniqueId", username)
                    startActivity(intent)
                } else {
                    Toast.makeText(this, "Invalid Credentials", Toast.LENGTH_SHORT).show()
                }
            }.addOnFailureListener {
                Toast.makeText(this, "Failed to connect to database", Toast.LENGTH_SHORT).show()
            }*/

            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please enter both username and password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Fetch user data from Firebase
            database.child(username).get().addOnSuccessListener { snapshot ->
                if (snapshot.exists()) {
                    val dbPassword = snapshot.child("password").value as? String
                    if (dbPassword != null) {
                        // Compare the password with the database password
                        if (password == dbPassword) {
                            // Authentication successful, move to location access
                            val intent = Intent(this, LocationTrackerActivity::class.java)
                            intent.putExtra("uniqueId", username)
                            startActivity(intent)
                        } else {
                            Toast.makeText(this, "Invalid password", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(this, "Password not found for user", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(this, "User does not exist", Toast.LENGTH_SHORT).show()
                }
            }.addOnFailureListener {
                Toast.makeText(this, "Failed to connect to database", Toast.LENGTH_SHORT).show()
            }
        }
    }

}
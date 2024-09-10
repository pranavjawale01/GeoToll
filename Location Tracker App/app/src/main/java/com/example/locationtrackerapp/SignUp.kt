package com.example.locationtrackerapp

import android.content.Intent
import android.os.Bundle
import android.text.TextUtils
import android.util.Patterns
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser

class SignUp : AppCompatActivity() {

    private lateinit var editTextEmail: TextInputEditText
    private lateinit var editTextPassword: TextInputEditText
    private lateinit var buttonSignUp: Button
    private lateinit var mAuth: FirebaseAuth
    private lateinit var progressBar: ProgressBar
    private lateinit var textView: TextView

    override fun onStart() {
        super.onStart()
        // Check if user is signed in (non-null) and update UI accordingly.
        val currentUser: FirebaseUser? = mAuth.currentUser
        if (currentUser != null) {
            val intent = Intent(applicationContext, MainActivity::class.java)
            startActivity(intent)
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sign_up)

        mAuth = FirebaseAuth.getInstance()
        editTextEmail = findViewById(R.id.email)
        editTextPassword = findViewById(R.id.password)
        buttonSignUp = findViewById(R.id.btn_signup)
        progressBar = findViewById(R.id.progressBar)
        textView = findViewById(R.id.loginNow)

        textView.setOnClickListener {
            val intent = Intent(applicationContext, LogIn::class.java)
            startActivity(intent)
            finish()
        }

        buttonSignUp.setOnClickListener {
            progressBar.visibility = View.VISIBLE
            val email = editTextEmail.text.toString()
            val password = editTextPassword.text.toString()

            if (TextUtils.isEmpty(email)) {
                Toast.makeText(this@SignUp, "Enter Email", Toast.LENGTH_SHORT).show()
                progressBar.visibility = View.GONE
                return@setOnClickListener
            }
            if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                Toast.makeText(this@SignUp, "Enter a valid Email", Toast.LENGTH_SHORT).show()
                progressBar.visibility = View.GONE
                return@setOnClickListener
            }
            if (TextUtils.isEmpty(password)) {
                Toast.makeText(this@SignUp, "Enter Password", Toast.LENGTH_SHORT).show()
                progressBar.visibility = View.GONE
                return@setOnClickListener
            }

            mAuth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener(this@SignUp) { task ->
                    progressBar.visibility = View.GONE
                    if (task.isSuccessful) {
                        Toast.makeText(this@SignUp, "Account Created.", Toast.LENGTH_SHORT).show()
                        val intent = Intent(applicationContext, LogIn::class.java)
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(this@SignUp, "Authentication failed.", Toast.LENGTH_SHORT).show()
                    }
                }
        }
    }
}
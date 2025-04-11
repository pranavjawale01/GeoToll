const otpMap = new Map();
require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Initialization using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key.replace(/\\n/g, "\n"),
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: process.env.universe_domain,
  }),
  databaseURL: process.env.FB_DATABASE_URL,
});

const db = admin.database();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// 📧 Login Notification
async function sendLoginEmail(email, name) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "🔐 Login Notification - Toll System",
    text: `
Hello ${name},

You have successfully logged in to the Toll Management System.

If this wasn't you, please report immediately.

🕒 Time: ${new Date().toLocaleString()}

Regards,
Toll Management System Team
    `,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Login email error:", err);
        reject(err); // 💥 so we don’t mark sent if it fails
      } else {
        console.log("✅ Login email sent to:", email);
        resolve(info);
      }
    });
  });
}
// 📧 Penalty Notification
async function sendPenaltyEmail(email, data, penaltyRef, name) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "🚨 Overspeeding Penalty Alert",
    text: `
Hello ${name},

Your vehicle has been recorded overspeeding.

Details:
📍 Location: (${data.lat || "N/A"}, ${data.lon || "N/A"})
🚗 Speed: ${data.speed || "N/A"} km/h
📏 Limit: ${data.speed_limit || "N/A"} km/h
💸 Charge: ₹${data.penalty_charge || "Not specified"}
🕒 Time: ${data.timestamp || "Unknown"}

Please ensure safe driving in the future.

Regards,
Toll Management System Team
    `,
  };

  transporter.sendMail(mailOptions, async (err, info) => {
    if (err) {
      console.error("❌ Penalty email error:", err);
    } else {
      console.log("✅ Penalty email sent to:", email);
      await penaltyRef.update({ email_sent: true });
    }
  });
}

// 📧 GPS Failure Notification
async function sendGPSFailureEmail(email, name, data, date, time, gpsRef) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "📍 GPS Failure Alert",
    text: `
Hello ${name},

We noticed a GPS failure on your device.

📱 Device Model: ${data.deviceModel || "N/A"}
📄 App Version: ${data.appVersion || "N/A"}
⛔ Status: ${data.gpsStatusMessage || "GPS Failed to Operate"}
🕒 Time: ${date} ${time}

Please check your device's GPS settings and retry.

Regards,
Toll Management System Team
    `,
  };

  transporter.sendMail(mailOptions, async (err, info) => {
    if (err) {
      console.error("❌ GPS failure email error:", err);
    } else {
      console.log("✅ GPS failure email sent to:", email);
      await gpsRef.update({ emailSent: true });
    }
  });
}

// 🔄 Listen for new penalty entries
const penaltiesRef = db.ref("/penalties");

penaltiesRef.on("child_added", (userSnap) => {
  const userId = userSnap.key;

  userSnap.forEach((dateSnap) => {
    dateSnap.ref.on("child_added", async (timeSnap) => {
      const data = timeSnap.val();

      // Skip if email already sent
      if (data.email_sent) return;

      const penaltyRef = timeSnap.ref;

      // Fetch user's email & name
      const userSnapshot = await db.ref(`/users/${userId}`).once("value");
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const email = userData.email;
        const name = userData.name;

        if (email) {
          sendPenaltyEmail(email, data, penaltyRef, name);
        }
      }
    });
  });
});

// 🔄 Listen for isLoggedIn status change
const usersRef = db.ref("/users");

let previousLoginStatus = {};

usersRef.on("child_changed", async (userSnap) => {
  const userId = userSnap.key;
  const userData = userSnap.val();
  const email = userData.email;
  const name = userData.name;

  const currentStatus = userData.isLoggedIn;
  const previousStatus = previousLoginStatus[userId];

  try {
    // 🟢 Detect only true login event
    if (currentStatus === true && previousStatus === false) {
      if (email && !userData.login_email_sent) {
        await sendLoginEmail(email, name); // ⏳ wait first
        await db.ref(`/users/${userId}/login_email_sent`).set(true); // ✅ set after success
      }
    }

    // 🔄 Reset flag on logout
    if (currentStatus === false && userData.login_email_sent) {
      await db.ref(`/users/${userId}/login_email_sent`).set(false);
    }

    previousLoginStatus[userId] = currentStatus;
  } catch (error) {
    console.error("❌ Error in login status handler:", error);
  }
});

// 🔄 Listen for GPS failures
const gpsFailedRef = db.ref("/GPSFailed");

gpsFailedRef.on("child_added", (userSnap) => {
  const userId = userSnap.key;

  userSnap.forEach((dateSnap) => {
    const date = dateSnap.key;

    dateSnap.ref.on("child_added", async (timeSnap) => {
      const time = timeSnap.key;
      const data = timeSnap.val();

      if (data.emailSent) return;

      const gpsRef = timeSnap.ref;

      // Fetch user's email & name
      const userSnapshot = await db.ref(`/users/${userId}`).once("value");
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const email = userData.email;
        const name = userData.name;

        if (email) {
          sendGPSFailureEmail(email, name, data, date, time, gpsRef);
        }
      }
    });
  });
});

// ✅ New Route to send OTP
app.post("/send-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).send("Missing email or OTP");
  }

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "🔐 Your OTP for Toll System Login",
    text: `
Hello,

Your One-Time Password (OTP) for logging into the Toll Management System is:

👉 OTP: ${otp}

Please do not share this OTP with anyone.

🕒 Time: ${new Date().toLocaleString()}

If this wasn't you, please ignore this email.

Regards,
Toll Management System Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}: ${otp}`);

    // Store OTP temporarily for validation (optional, only if needed)
    otpMap.set(email, otp);
    setTimeout(() => otpMap.delete(email), 5 * 60 * 1000); // delete after 5 minutes

    res.status(200).send("OTP sent successfully");
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    res.status(500).send("Failed to send OTP");
  }
});

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.send("Toll tracking server is up and running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

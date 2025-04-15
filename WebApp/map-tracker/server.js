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

// HTML Email Template Generator
function generateEmailTemplate({ title, preheader, greeting, content, actionButton, footerNote }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Base Styles */
    body {
      font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .preheader {
      display: none;
      font-size: 1px;
      color: transparent;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
    .header {
      background-color: #0056b3;
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      text-decoration: none;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .divider {
      height: 4px;
      background: linear-gradient(to right, #0056b3, #00a0e9);
      margin: 20px 0;
      border: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0056b3;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 15px 0;
    }
    .card {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #0056b3;
    }
    .detail-row {
      display: flex;
      margin-bottom: 12px;
    }
    .detail-label {
      font-weight: bold;
      width: 150px;
      color: #555555;
    }
    .detail-value {
      flex: 1;
    }
    .highlight {
      color: #0056b3;
      font-weight: bold;
    }
    .alert {
      color: #d9534f;
      font-weight: bold;
    }
    .footer {
      padding: 20px;
      text-align: center;
      background-color: #f0f0f0;
      font-size: 12px;
      color: #666666;
    }
    .otp-display {
      font-size: 32px;
      letter-spacing: 5px;
      padding: 15px;
      background-color: #f0f8ff;
      border: 1px dashed #0056b3;
      border-radius: 4px;
      text-align: center;
      margin: 20px 0;
    }
    .list {
      padding-left: 20px;
    }
    .list li {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Preheader Text -->
    <div class="preheader">${preheader || title}</div>
    
    <!-- Header -->
    <div class="header">
      <div class="logo">Toll Management System</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="greeting">${greeting}</div>
      
      <hr class="divider">
      
      ${content}
      
      ${actionButton ? `<p style="text-align: center;"><a href="${actionButton.url}" class="button">${actionButton.text}</a></p>` : ''}
      
      <p>If you have any questions, please contact our support team.</p>
      
      <p>Best regards,<br><strong>Toll Management System Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>© ${new Date().getFullYear()} Toll Management System. All rights reserved.</p>
      ${footerNote ? `<p>${footerNote}</p>` : ''}
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function cleanKeys(obj) {
  const cleaned = {};
  for (const key in obj) {
    cleaned[key.trim()] = obj[key];
  }
  return cleaned;
}

// 📧 Login Notification
async function sendLoginEmail(email, name) {
  
  const mailOptions = {
    from: `Toll Management System <${process.env.EMAIL}>`,
    to: email,
    subject: "🔐 Successful Login to Your Account",
    html: generateEmailTemplate({
      title: "Login Notification",
      preheader: "We noticed a login to your account",
      greeting: `Hello ${name},`,
      content: `
        <p>We detected a successful login to your Toll Management System account.</p>
        
        <div class="card">
          <div class="detail-row">
            <div class="detail-label">Login Status:</div>
            <div class="detail-value highlight">Successful</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date & Time:</div>
            <div class="detail-value">${new Date().toLocaleString()}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Device:</div>
            <div class="detail-value">Web Browser</div>
          </div>
        </div>
        
        <p>If this wasn't you, please secure your account immediately by:</p>
        <ul class="list">
          <li>Changing your password</li>
          <li>Contacting our support team</li>
        </ul>
      `,
      footerNote: "For security reasons, we recommend reviewing your account activity regularly."
    })
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Login email error:", err);
        reject(err);
      } else {
        console.log("✅ Login email sent to:", email);
        resolve(info);
      }
    });
  });
}

// 📧 Penalty Notification
async function sendPenaltyEmail(email, data, penaltyRef, name) {
  console.log("📦 Data passed to email template:", JSON.stringify(data, null, 2));
  const cleanedData = cleanKeys(data);
  data = cleanedData;
  console.log("📦 Data passed to email template:", JSON.stringify(data, null, 2));
  const mailOptions = {
    from: `Toll Management System <${process.env.EMAIL}>`,
    to: email,
    subject: "🚨 Overspeeding Penalty Alert",
    html: generateEmailTemplate({
      title: "Overspeeding Penalty",
      preheader: `Penalty charge of ₹${data. penaltyCharge || "0"} applied`,
      greeting: `Dear ${name},`,
      content: `
        <p>Your vehicle has been recorded exceeding the speed limit in a toll zone.</p>
    
        <div class="card">
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div class="detail-value">${data.latitude || "N/A"}, ${data.longitude || "N/A"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Recorded Speed:</div>
            <div class="detail-value alert">${data. speed?.toFixed(2) || "N/A"} km/h</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Speed Limit:</div>
            <div class="detail-value">${data.speedLimit || "N/A"} km/h</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Penalty Amount:</div>
            <div class="detail-value alert">₹${data. penaltyCharge || "0"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Timestamp:</div>
            <div class="detail-value">${data. timeStamp || "Unknown"}</div>
          </div>
        </div>
        
        <p>This penalty will be added to your next toll payment invoice.</p>
        <p>Please ensure you adhere to posted speed limits for your safety and the safety of others.</p>
      `,
      footerNote: "You may contest this penalty within 7 days of issuance."
    })
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
    from: `Toll Management System <${process.env.EMAIL}>`,
    to: email,
    subject: "📍 GPS Failure Alert",
    html: generateEmailTemplate({
      title: "GPS Functionality Issue",
      preheader: "GPS failure detected on your device",
      greeting: `Dear ${name},`,
      content: `
        <p>Our system detected an issue with your device's GPS functionality.</p>
        
        <div class="card">
          <div class="detail-row">
            <div class="detail-label">Device Model:</div>
            <div class="detail-value">${data.deviceModel || "N/A"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">App Version:</div>
            <div class="detail-value">${data.appVersion || "N/A"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Status:</div>
            <div class="detail-value alert">${data.gpsStatusMessage || "GPS Not Functioning"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date & Time:</div>
            <div class="detail-value">${date} ${time}</div>
          </div>
        </div>
        
        <p>This may affect toll calculations and location services. Please:</p>
        <ul class="list">
          <li>Ensure location services are enabled</li>
          <li>Check your device's GPS settings</li>
          <li>Restart the application</li>
          <li>Move to an area with better reception if indoors</li>
        </ul>
      `,
      footerNote: "Service may be affected until GPS functionality is restored."
    })
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
      //console.log(`Penalty Data for ${userId}:`, data);

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

  console.log(`User ${userId} login status changed: ${currentStatus}`);

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
  console.log(`New GPS failure for user ${userId}`);

  userSnap.forEach((dateSnap) => {
    const date = dateSnap.key;

    dateSnap.ref.on("child_added", async (timeSnap) => {
      const time = timeSnap.key;
      const data = timeSnap.val();

      //console.log(`GPS Failure Data for ${userId} at ${date} ${time}:`, data);

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
    from:`Toll Management System <${process.env.EMAIL}>`,
    to: email,
    subject: "🔐 Your OTP for Toll System Login",
    html: generateEmailTemplate({
      title: "One-Time Password",
      preheader: `Your OTP is ${otp}`,
      greeting: "Hello,",
      content: `
        <p>Use the following OTP to authenticate your Toll Management System login:</p>
        
        <div class="otp-display">${otp}</div>
        
        <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        <p>If you didn't request this OTP, please secure your account immediately.</p>
      `,
      footerNote: "For security reasons, we never ask for your password or OTP via phone or email."
    })
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

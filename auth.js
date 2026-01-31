const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const nodemailer = require("nodemailer");

const router = express.Router();

// Nodemailer Config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =========================
   REGISTER
========================= */
router.post("/register", (req, res) => {
  const { email, password, role } = req.body;
  const hash = bcrypt.hashSync(password, 10);

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

  db.query(
    "INSERT INTO users (email, password_hash, role, otp_code, otp_expires_at) VALUES (?,?,?,?,?)",
    [email, hash, role || "STUDENT", otp, expiresAt],
    (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: "Email already registered" });
        }
        return res.status(500).json(err);
      }

      // Check if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("⚠️ SMTP credentials missing in .env");
        console.log("==================================");
        console.log("🔑 OTP CODE:", otp);
        console.log("==================================");

        return res.json({
          message: "Registration successful. OTP logged to server terminal (SMTP missing).",
          requireOtp: true
        });
      }

      // Send Email
      const mailOptions = {
        from: process.env.SMTP_USER || 'no-reply@ilham.com',
        to: email,
        subject: 'ILHAM Verification Code',
        text: `Your verification code is: ${otp}. It expires in 10 minutes.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email send error:", error);

          // FALLBACK: Log OTP to console so dev can still verify
          console.log("⚠️ EMAIL FAILED. FALLBACK OTP:");
          console.log("==================================");
          console.log("🔑 OTP CODE:", otp);
          console.log("==================================");

          // Return success with warning
          return res.status(200).json({
            message: "Registration successful. Email failed, but OTP logged to server console.",
            warning: true
          });
        }
        res.json({
          message: "Registration successful. OTP sent to email.",
          requireOtp: true
        });
      });
    }
  );
});

/* =========================
   VERIFY OTP
========================= */
/* =========================
   FORGOT PASSWORD
========================= */
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "User not found" });

    const user = result[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Save OTP
    db.query(
      "UPDATE users SET otp_code=?, otp_expires_at=? WHERE id=?",
      [otp, expiresAt, user.id],
      (err) => {
        if (err) return res.status(500).json(err);

        // Send Email (Reuse similar logic)
        const mailOptions = {
          from: process.env.SMTP_USER || 'no-reply@ilham.com',
          to: email,
          subject: 'ILHAM Password Reset OTP',
          text: `Your password reset code is: ${otp}. It expires in 10 minutes.`
        };

        // Check SMTP config
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          console.log("⚠️ SMTP missing. Logged OTP:", otp);
          return res.json({ message: "OTP logged to console (SMTP missing)." });
        }

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            console.error("Email error:", error);
            console.log("⚠️ Fallback OTP:", otp);
            return res.json({ message: "Email failed, OTP logged to console." });
          }
          res.json({ message: "OTP sent to email." });
        });
      }
    );
  });
});

/* =========================
   VERIFY OTP (Handling Registration & PWD Reset)
========================= */
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "User not found" });

    const user = result[0];
    const now = new Date();

    // Check OTP
    if (user.otp_code === otp && new Date(user.otp_expires_at) > now) {
      // Success: clear OTP
      db.query("UPDATE users SET is_verified=1, otp_code=NULL, otp_expires_at=NULL WHERE id=?", [user.id], (err) => {
        if (err) return res.status(500).json(err);

        // Generate token (used for auto-login OR parameter for password reset)
        const token = jwt.sign(
          { id: user.id, role: user.role, type: 'reset_access' },
          process.env.JWT_SECRET,
          { expiresIn: "15m" } // Short lived
        );
        res.json({ message: "Verification successful", token });
      });
    } else {
      res.status(400).json({ message: "Invalid or expired OTP" });
    }
  });
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hash = bcrypt.hashSync(newPassword, 10);

    db.query("UPDATE users SET password_hash=? WHERE id=?", [hash, decoded.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Password reset successfully." });
    });
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    (err, result) => {
      if (!result.length)
        return res.status(401).json({ error: "Invalid login" });

      const user = result[0];

      if (!bcrypt.compareSync(password, user.password_hash))
        return res.status(401).json({ error: "Invalid login" });

      if (!user.is_verified) {
        // Allow re-sending OTP if needed (future improvement)
        return res.status(403).json({ error: "Email not verified", requireOtp: true });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
    }
  );
});

module.exports = router;

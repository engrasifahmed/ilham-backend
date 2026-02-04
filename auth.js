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
   PUBLIC STUDENT REGISTRATION
   Uses same logic as admin student creation
========================= */
router.post("/register", (req, res) => {
  const { full_name, email, phone, dob, password, passport_no, nationality, guardian_name, guardian_phone } = req.body;

  // Validate required fields
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: "Full name, email, and password are required" });
  }

  // Check if email already exists in students table
  db.query(
    "SELECT id FROM students WHERE email = ?",
    [email],
    (err, existing) => {
      if (err) {
        console.error("Email check error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Password hash error:", err);
          return res.status(500).json({ error: "Failed to process password" });
        }

        // Create user account first
        const otp = generateOTP();

        db.query(
          `INSERT INTO users (email, password_hash, is_verified, role, otp_code, otp_expires_at)
           VALUES (?, ?, 0, 'STUDENT', ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
          [email, hashedPassword, otp],
          (err, userResult) => {
            if (err) {
              console.error("User creation error:", err);
              return res.status(500).json({ error: "Failed to create user account" });
            }

            const user_id = userResult.insertId;

            // Create student record
            db.query(
              `INSERT INTO students (user_id, full_name, phone, dob, passport_no, nationality)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [user_id, full_name, phone || null, dob || null, passport_no || null, nationality || null],
              (err, studentResult) => {
                if (err) {
                  console.error("Student creation error:", err);
                  // Rollback: delete user account
                  db.query("DELETE FROM users WHERE id = ?", [user_id]);
                  return res.status(500).json({ error: "Failed to create student record" });
                }

                const student_id = studentResult.insertId;

                // Create guardian record if provided
                if (guardian_name || guardian_phone) {
                  db.query(
                    `INSERT INTO guardians (student_id, guardian_name, guardian_phone)
                     VALUES (?, ?, ?)`,
                    [student_id, guardian_name || null, guardian_phone || null],
                    (err) => {
                      if (err) {
                        console.error("Guardian creation error:", err);
                        // Continue anyway - guardian is optional
                      }
                    }
                  );
                }

                // Send OTP Email
                transporter.sendMail({
                  from: process.env.SMTP_USER,
                  to: email,
                  subject: "Verify Your Email - ILHAM Education",
                  text: `Welcome to ILHAM Education! Your verification code is: ${otp}`
                });

                res.status(201).json({
                  message: "Registration successful. Please verify your email.",
                  student_id: student_id,
                  verify_required: true,
                  email: email
                });
              }
            );
          }
        );
      });
    }
  );
});

/* =========================
   FORGOT PASSWORD
========================= */
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, users) => {
    if (err) return res.status(500).json(err);
    if (users.length === 0)
      return res.status(404).json({ message: "No user with that email" });

    const user = users[0];

    // Generate reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?",
      [resetToken, user.id],
      (err) => {
        if (err) return res.status(500).json(err);

        // Send email
        const resetUrl = `http://localhost:4000/reset-password.html?token=${resetToken}`;

        transporter.sendMail(
          {
            from: process.env.SMTP_USER,
            to: email,
            subject: "Password Reset Request",
            text: `Click this link to reset your password: ${resetUrl}`,
          },
          (error) => {
            if (error) {
              console.error("Email error:", error);
              return res
                .status(500)
                .json({ message: "Could not send email" });
            }
            res.json({ message: "Reset link sent" });
          }
        );
      }
    );
  });
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(400).json({ message: "Invalid or expired token" });

    const hash = bcrypt.hashSync(newPassword, 10);

    db.query(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hash, decoded.id],
      (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Password reset successfully" });
      }
    );
  });
});

/* =========================
   LOGIN
========================= */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, users) => {
    if (err) return res.status(500).json(err);
    if (users.length === 0) {
      return res.status(404).json({ error: "Email not registered" });
    }

    const user = users[0];
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    // Check verification
    if (user.is_verified === 0) {
      return res.status(403).json({ error: "Email not verified", verify_required: true, email: email });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  });
});

/* =========================
   STUDENT OTP ROUTES
========================= */

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// VERIFY EMAIL (REGISTRATION)
router.post("/student/verify-email", (req, res) => {
  const { email, otp } = req.body;

  db.query("SELECT * FROM users WHERE email = ? AND role='STUDENT'", [email], (err, users) => {
    if (err) return res.status(500).json(err);
    if (users.length === 0) return res.status(404).json({ message: "User not found" });

    const user = users[0];

    // Check if verified
    if (user.is_verified === 1) return res.json({ message: "Already verified" });

    // Verify OTP
    if (user.otp_code !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date(user.otp_expires_at) < new Date()) return res.status(400).json({ message: "OTP Expired" });

    // Update
    db.query("UPDATE users SET is_verified=1, otp_code=NULL, otp_expires_at=NULL WHERE id=?", [user.id], (updErr) => {
      if (updErr) return res.status(500).json(updErr);
      res.json({ message: "Email verified successfully" });
    });
  });
});

// FORGOT PASSWORD (OTP)
router.post("/student/forgot-password", (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM users WHERE email = ? AND role='STUDENT'", [email], (err, users) => {
    if (err) return res.status(500).json(err);
    if (users.length === 0) return res.status(404).json({ message: "User not found" });

    const user = users[0];
    const otp = generateOTP();

    db.query("UPDATE users SET otp_code=?, otp_expires_at=DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id=?", [otp, user.id], (uErr) => {
      if (uErr) return res.status(500).json(uErr);

      // Send Email
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP is: ${otp}`
      });

      res.json({ message: "OTP sent to email" });
    });
  });
});

// RESET PASSWORD (WITH OTP)
router.post("/student/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;

  db.query("SELECT * FROM users WHERE email = ? AND role='STUDENT'", [email], (err, users) => {
    if (err) return res.status(500).json(err);
    if (users.length === 0) return res.status(404).json({ message: "User not found" });

    const user = users[0];
    if (user.otp_code !== otp || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hash = bcrypt.hashSync(newPassword, 10);

    db.query("UPDATE users SET password_hash=?, otp_code=NULL, otp_expires_at=NULL WHERE id=?", [hash, user.id], (updErr) => {
      if (updErr) return res.status(500).json(updErr);
      res.json({ message: "Password reset successfully" });
    });
  });
});

module.exports = router;

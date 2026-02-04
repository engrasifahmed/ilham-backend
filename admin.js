const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer configuration for student photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "public/uploads/students");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed'));
  }
});

// Test endpoint
router.post("/test", (req, res) => {
  console.log('TEST ENDPOINT HIT!');
  res.json({ message: "Test successful", body: req.body });
});

/* ================================
   CREATE IELTS COURSE (ADMIN)
================================ */
router.post("/ielts/course", auth, adminOnly, (req, res) => {
  const { batch_name, start_date, end_date, instructor } = req.body;

  db.query(
    "INSERT INTO ielts_courses (batch_name, start_date, end_date, instructor) VALUES (?,?,?,?)",
    [batch_name, start_date, end_date, instructor],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "IELTS course created" });
    }
  );
});

/* ================================
   CREATE MOCK TEST (ADMIN)
================================ */
router.post("/ielts/mock", auth, adminOnly, (req, res) => {
  const { course_id, test_name, test_date } = req.body;

  db.query(
    "INSERT INTO ielts_mock_tests (course_id, test_name, test_date) VALUES (?,?,?)",
    [course_id, test_name, test_date],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Mock test created" });
    }
  );
});

/* ================================
   ENTER STUDENT RESULT (ADMIN)
================================ */
router.post("/ielts/result", auth, adminOnly, (req, res) => {
  const {
    mock_test_id,
    student_id,
    listening,
    reading,
    writing,
    speaking,
    overall
  } = req.body;

  db.query(
    `INSERT INTO ielts_results
     (mock_test_id, student_id, listening, reading, writing, speaking, overall)
     VALUES (?,?,?,?,?,?,?)`,
    [mock_test_id, student_id, listening, reading, writing, speaking, overall],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Result saved" });
    }
  );
});

/* =========================
   ADD UNIVERSITY (ADMIN)
========================= */
router.post("/university", auth, adminOnly, (req, res) => {
  const { name, country, requirements } = req.body;

  db.query(
    "INSERT INTO universities (name, country, requirements) VALUES (?,?,?)",
    [name, country, requirements],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "University added" });
    }
  );
});

/* =========================
   CREATE APPLICATION (ADMIN)
========================= */
router.post("/applications/create", auth, adminOnly, (req, res) => {
  const { student_id, university_id } = req.body;

  if (!student_id || !university_id) {
    return res.status(400).json({ message: "Student and University are required" });
  }

  // Check for duplicate application
  db.query(
    "SELECT id, status FROM applications WHERE student_id = ? AND university_id = ?",
    [student_id, university_id],
    (err, existing) => {
      if (err) {
        console.error("Duplicate check error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      // If exists and rejected, delete it
      if (existing.length > 0) {
        const existingApp = existing[0];

        if (existingApp.status === 'Rejected') {
          // Delete rejected application to allow reapplication
          db.query(
            "DELETE FROM applications WHERE id = ?",
            [existingApp.id],
            (delErr) => {
              if (delErr) {
                console.error("Delete rejected app error:", delErr);
                return res.status(500).json({
                  message: "Failed to process reapplication"
                });
              }

              console.log(`✅ Admin deleted rejected application ${existingApp.id} for reapplication`);

              // Create new application
              db.query(
                `INSERT INTO applications (student_id, university_id, status, created_at)
                 VALUES (?, ?, 'Applied', NOW())`,
                [student_id, university_id],
                (err, result) => {
                  if (err) {
                    console.error("Application creation error:", err);
                    return res.status(500).json({ message: "Failed to create application" });
                  }

                  res.json({
                    message: "Application created successfully",
                    application_id: result.insertId
                  });
                }
              );
            }
          );
          return;
        } else {
          return res.status(400).json({
            message: `Student already has a ${existingApp.status} application to this university`
          });
        }
      }

      // No existing app, create new
      db.query(
        `INSERT INTO applications (student_id, university_id, status, created_at)
         VALUES (?, ?, 'Applied', NOW())`,
        [student_id, university_id],
        (err, result) => {
          if (err) {
            console.error("Application creation error:", err);
            return res.status(500).json({ message: "Failed to create application" });
          }

          res.json({
            message: "Application created successfully",
            application_id: result.insertId
          });
        }
      );
    }
  );
});

/* =========================
   UPDATE APPLICATION (ADMIN)
========================= */
router.put("/applications/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;
  const { university_id, status } = req.body;

  if (!university_id && !status) {
    return res.status(400).json({ message: "At least one field is required" });
  }

  // Validate status if provided
  const validStatuses = ['Applied', 'Approved', 'Rejected'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (university_id) {
    updates.push("university_id = ?");
    values.push(university_id);
  }
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }

  values.push(id);

  db.query(
    `UPDATE applications SET ${updates.join(", ")} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        console.error("Application update error:", err);
        return res.status(500).json({ message: "Failed to update application" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json({ message: "Application updated successfully" });
    }
  );
});

/* =========================
   GET STUDENTS LIST (ADMIN)
========================= */
router.get("/students/list", auth, adminOnly, (req, res) => {
  db.query(
    `SELECT 
      s.*,
      u.email
    FROM students s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.full_name ASC`,
    (err, rows) => {
      if (err) {
        console.error("Students list error:", err);
        return res.status(500).json({ message: "Failed to fetch students" });
      }
      res.json(rows);
    }
  );
});

/* =========================
   GET UNIVERSITIES LIST (ADMIN)
========================= */
router.get("/universities/list", auth, adminOnly, (req, res) => {
  db.query(
    "SELECT id, name, country FROM universities ORDER BY name ASC",
    (err, rows) => {
      if (err) {
        console.error("Universities list error:", err);
        return res.status(500).json({ message: "Failed to fetch universities" });
      }
      res.json(rows);
    }
  );
});

/* =========================
   CREATE STUDENT (ADMIN)
========================= */
router.post("/students/create", auth, adminOnly, (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('STUDENT CREATE ENDPOINT HIT!');
  console.log('Time:', new Date().toISOString());
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(60) + '\n');

  const { full_name, email, phone, password, passport_no, nationality, guardian_name, guardian_phone } = req.body;

  if (!full_name || !email || !password) {
    console.log('❌ Validation failed: missing required fields');
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  // Check if email already exists
  db.query(
    "SELECT id FROM students WHERE email = ?",
    [email],
    (err, existing) => {
      if (err) {
        console.error("Email check error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (existing.length > 0) {
        console.log('❌ Email already exists');
        return res.status(400).json({ message: "Email already registered" });
      }

      console.log('✅ Email check passed, hashing password...');

      // Hash password using bcryptjs (already installed)
      const bcrypt = require('bcryptjs');
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Password hash error:", err);
          return res.status(500).json({ message: "Failed to process password" });
        }

        console.log('✅ Password hashed, creating user account...');

        // Step 1: Create user account first
        db.query(
          `INSERT INTO users (email, password_hash, is_verified, role)
           VALUES (?, ?, 1, 'STUDENT')`,
          [email, hashedPassword],
          (err, userResult) => {
            if (err) {
              console.error("User creation error:", err);
              return res.status(500).json({ message: "Failed to create user account", error: err.message });
            }

            const userId = userResult.insertId;
            console.log('✅ User created with ID:', userId);

            // Step 2: Create student record with user_id
            db.query(
              `INSERT INTO students (user_id, full_name, phone, passport_no, nationality)
               VALUES (?, ?, ?, ?, ?)`,
              [userId, full_name, phone || null, req.body.passport_no || null, req.body.nationality || null],
              (err, result) => {
                if (err) {
                  console.error("Student creation error:", err);
                  console.error("SQL:", err.sql);
                  console.error("Values:", [full_name, email, hashedPassword, phone || null, req.body.passport_no || null, req.body.nationality || null]);
                  return res.status(500).json({ message: "Failed to create student", error: err.message });
                }

                const studentId = result.insertId;

                // Insert guardian if provided
                if (guardian_name || guardian_phone) {
                  db.query(
                    `INSERT INTO guardians (student_id, guardian_name, guardian_phone)
                 VALUES (?, ?, ?)`,
                    [studentId, guardian_name || null, guardian_phone || null],
                    (err) => {
                      if (err) console.error("Guardian creation error:", err);
                    }
                  );
                }

                res.json({
                  message: "Student created successfully",
                  student_id: studentId
                });
              }
            );
          });
      }
      );
    });
});

/* =========================
   UPDATE STUDENT (ADMIN)
========================= */
router.put("/students/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, guardian_name, guardian_phone } = req.body;

  if (!full_name && !email && !phone && !guardian_name && !guardian_phone) {
    return res.status(400).json({ message: "At least one field is required" });
  }

  // Build dynamic update query for student
  const studentUpdates = [];
  const studentValues = [];

  if (full_name) {
    studentUpdates.push("full_name = ?");
    studentValues.push(full_name);
  }
  if (email) {
    studentUpdates.push("email = ?");
    studentValues.push(email);
  }
  if (phone !== undefined) {
    studentUpdates.push("phone = ?");
    studentValues.push(phone);
  }

  if (studentUpdates.length > 0) {
    studentValues.push(id);

    db.query(
      `UPDATE students SET ${studentUpdates.join(", ")} WHERE id = ?`,
      studentValues,
      (err, result) => {
        if (err) {
          console.error("Student update error:", err);
          return res.status(500).json({ message: "Failed to update student" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Student not found" });
        }

        // Update guardian if provided
        if (guardian_name !== undefined || guardian_phone !== undefined) {
          db.query(
            "SELECT id FROM guardians WHERE student_id = ?",
            [id],
            (err, guardians) => {
              if (err) {
                console.error("Guardian check error:", err);
                return res.json({ message: "Student updated, but guardian update failed" });
              }

              if (guardians.length > 0) {
                // Update existing guardian
                const guardianUpdates = [];
                const guardianValues = [];

                if (guardian_name !== undefined) {
                  guardianUpdates.push("guardian_name = ?");
                  guardianValues.push(guardian_name);
                }
                if (guardian_phone !== undefined) {
                  guardianUpdates.push("guardian_phone = ?");
                  guardianValues.push(guardian_phone);
                }

                guardianValues.push(id);

                db.query(
                  `UPDATE guardians SET ${guardianUpdates.join(", ")} WHERE student_id = ?`,
                  guardianValues,
                  (err) => {
                    if (err) console.error("Guardian update error:", err);
                    res.json({ message: "Student and guardian updated successfully" });
                  }
                );
              } else if (guardian_name || guardian_phone) {
                // Create new guardian
                db.query(
                  "INSERT INTO guardians (student_id, guardian_name, guardian_phone) VALUES (?, ?, ?)",
                  [id, guardian_name || null, guardian_phone || null],
                  (err) => {
                    if (err) console.error("Guardian creation error:", err);
                    res.json({ message: "Student updated and guardian added" });
                  }
                );
              } else {
                res.json({ message: "Student updated successfully" });
              }
            }
          );
        } else {
          res.json({ message: "Student updated successfully" });
        }
      }
    );
  } else {
    // Only guardian update
    db.query(
      "SELECT id FROM guardians WHERE student_id = ?",
      [id],
      (err, guardians) => {
        if (err) {
          return res.status(500).json({ message: "Database error" });
        }

        if (guardians.length > 0) {
          db.query(
            "UPDATE guardians SET guardian_name = ?, guardian_phone = ? WHERE student_id = ?",
            [guardian_name || null, guardian_phone || null, id],
            (err) => {
              if (err) {
                return res.status(500).json({ message: "Failed to update guardian" });
              }
              res.json({ message: "Guardian updated successfully" });
            }
          );
        } else {
          db.query(
            "INSERT INTO guardians (student_id, guardian_name, guardian_phone) VALUES (?, ?, ?)",
            [id, guardian_name || null, guardian_phone || null],
            (err) => {
              if (err) {
                return res.status(500).json({ message: "Failed to create guardian" });
              }
              res.json({ message: "Guardian added successfully" });
            }
          );
        }
      }
    );
  }
});

/* =========================
   UPLOAD STUDENT PHOTO (ADMIN)
========================= */
router.post("/students/:id/upload-photo", auth, adminOnly, uploadPhoto.single('photo'), (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No photo uploaded" });
  }

  const photoUrl = `/uploads/students/${req.file.filename}`;

  db.query(
    "UPDATE students SET photo_url = ? WHERE id = ?",
    [photoUrl, id],
    (err, result) => {
      if (err) {
        console.error("Photo upload error:", err);
        return res.status(500).json({ message: "Failed to update photo" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({
        message: "Photo uploaded successfully",
        photo_url: photoUrl
      });
    }
  );
});

/* =========================
   DELETE STUDENT (ADMIN)
========================= */
router.delete("/students/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;

  // Delete student (cascade will handle related records)
  db.query(
    "DELETE FROM students WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Student deletion error:", err);
        return res.status(500).json({ message: "Failed to delete student" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({ message: "Student deleted successfully" });
    }
  );
});

/* =========================
   GET STUDENT BY ID (ADMIN)
========================= */
router.get("/students/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT s.*, u.email 
     FROM students s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("Student fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch student" });
      }
      if (rows.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(rows[0]);
    }
  );
});

// Get student applications
router.get("/students/:id/applications", auth, adminOnly, (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT a.*, u.name as university_name, u.country as university_country
     FROM applications a
     JOIN universities u ON a.university_id = u.id
     WHERE a.student_id = ?
     ORDER BY a.created_at DESC`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("Student applications error:", err);
        return res.status(500).json({ message: "Failed to fetch applications" });
      }
      res.json(rows);
    }
  );
});

// Get student IELTS results
router.get("/students/:id/results", auth, adminOnly, (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT r.*, m.test_name
     FROM ielts_results r
     JOIN ielts_mock_tests m ON r.mock_test_id = m.id
     WHERE r.student_id = ?
     ORDER BY m.test_date DESC`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("Student results error:", err);
        return res.status(500).json({ message: "Failed to fetch results" });
      }
      res.json(rows);
    }
  );
});

// Get student invoices
router.get("/students/:id/invoices", auth, adminOnly, (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT i.*
     FROM invoices i
     JOIN applications a ON i.application_id = a.id
     WHERE a.student_id = ?
     ORDER BY i.created_at DESC`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("Student invoices error:", err);
        return res.status(500).json({ message: "Failed to fetch invoices" });
      }
      res.json(rows);
    }
  );
});

/* =========================
   UPDATE APPLICATION STATUS
========================= */
router.post("/application/status", auth, adminOnly, (req, res) => {
  const { application_id, status, counselor_remark } = req.body;

  db.query(
    "UPDATE applications SET status=?, counselor_remark=? WHERE id=?",
    [status, counselor_remark, application_id],
    (err, result) => {
      if (err) {
        console.error("Application status update error:", err);
        return res.status(500).json({
          message: "Update failed",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Update history with changed_by
      db.query(
        `UPDATE application_history 
         SET changed_by = ? 
         WHERE application_id = ? 
         AND changed_at = (
           SELECT MAX(changed_at) 
           FROM (SELECT * FROM application_history) AS ah 
           WHERE ah.application_id = ?
         )`,
        [req.userId, application_id, application_id],
        (histErr) => {
          if (histErr) {
            console.error("History update error:", histErr);
            // Don't fail the main operation
          }
          res.json({ message: "Application updated" });
        }
      );
    }
  );
});
/* =========================
   CREATE INVOICE (ADMIN)
========================= */
router.post("/invoice", auth, adminOnly, (req, res) => {
  const { application_id, amount } = req.body;

  if (!application_id || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check if application exists
  db.query(
    "SELECT id FROM applications WHERE id = ?",
    [application_id],
    (err, appResult) => {
      if (err) {
        console.error("Application check error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (appResult.length === 0) {
        return res.status(400).json({ message: "Application not found" });
      }

      // Check if invoice already exists for this application
      db.query(
        "SELECT id FROM invoices WHERE application_id = ?",
        [application_id],
        (err, existingInvoice) => {
          if (err) {
            console.error("Invoice check error:", err);
            return res.status(500).json({ message: "Database error" });
          }

          if (existingInvoice.length > 0) {
            return res.status(400).json({
              message: "Invoice already exists for this application",
              invoice_id: existingInvoice[0].id
            });
          }

          // Insert invoice (student info will be retrieved via JOIN in queries)
          db.query(
            `INSERT INTO invoices (application_id, amount, status)
             VALUES (?, ?, 'Unpaid')`,
            [application_id, amount],
            (err) => {
              if (err) {
                console.error("Invoice creation error:", err);
                return res.status(500).json({ message: "Invoice creation failed: " + err.message });
              }
              res.json({ message: "Invoice created successfully" });
            }
          );
        }
      );
    }
  );
});


/* =========================
   RECORD PAYMENT (ADMIN)
========================= */
router.post("/payment", auth, adminOnly, (req, res) => {
  const { invoice_id, amount, method } = req.body;

  // Validate input
  if (!invoice_id || !amount || !method) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // 1️⃣ Check invoice exists
  db.query(
    "SELECT id FROM invoices WHERE id = ?",
    [invoice_id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (rows.length === 0) {
        return res.status(400).json({ message: "Invoice not found" });
      }

      // 2️⃣ Insert payment
      db.query(
        "INSERT INTO payments (invoice_id, amount, method) VALUES (?,?,?)",
        [invoice_id, amount, method],
        (err) => {
          if (err)
            return res.status(500).json({ message: "Payment failed" });

          // 3️⃣ Update invoice status
          db.query(
            "UPDATE invoices SET status='Paid' WHERE id=?",
            [invoice_id],
            (updateErr) => {
              if (updateErr) {
                console.error("Invoice status update error:", updateErr);
                // Even if update fails, payment was recorded.
                // In a real app, this might require transaction management or rollback.
                return res.status(500).json({ message: "Payment recorded, but invoice status update failed." });
              }
              res.json({ message: "Payment recorded" });
            }
          );
        }
      );
    }
  );
});

/* =========================
   GET UNPAID INVOICES (Using View)
========================= */
router.get("/unpaid-invoices", auth, adminOnly, (req, res) => {
  db.query(
    "SELECT * FROM v_unpaid_invoices ORDER BY invoice_date DESC",
    (err, rows) => {
      if (err) {
        console.error("Unpaid invoices fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch unpaid invoices" });
      }
      res.json(rows);
    }
  );
});

/* =========================
   GET UNREAD NOTIFICATIONS COUNT (Using View)
========================= */
router.get("/unread-notifications", auth, adminOnly, (req, res) => {
  db.query(
    "SELECT * FROM v_unread_notifications WHERE unread_count > 0 ORDER BY unread_count DESC",
    (err, rows) => {
      if (err) {
        console.error("Unread notifications fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch unread notifications" });
      }
      res.json(rows);
    }
  );
});

/* =========================
   GET STUDENT APPLICATIONS SUMMARY (Using View)
========================= */
router.get("/student-applications-summary", auth, adminOnly, (req, res) => {
  const { student_id } = req.query;

  let query = "SELECT * FROM v_student_applications WHERE 1=1";
  const params = [];

  if (student_id) {
    query += " AND student_id = ?";
    params.push(student_id);
  }

  query += " ORDER BY applied_at DESC";

  db.query(query, params, (err, rows) => {
    if (err) {
      console.error("Student applications summary fetch error:", err);
      return res.status(500).json({ message: "Failed to fetch student applications summary" });
    }
    res.json(rows);
  });
});

/* =========================
   ADMIN DASHBOARD SUMMARY
========================= */
router.get("/dashboard", auth, adminOnly, (req, res) => {
  const dashboard = {};

  // 1️⃣ Total Students
  db.query("SELECT COUNT(*) AS totalStudents FROM students", (err, r1) => {
    if (err) return res.status(500).json(err);
    dashboard.totalStudents = r1[0].totalStudents;

    // 2️⃣ Total Applications
    db.query("SELECT COUNT(*) AS totalApplications FROM applications", (err, r2) => {
      if (err) return res.status(500).json(err);
      dashboard.totalApplications = r2[0].totalApplications;

      // 3️⃣ Applications by Status
      db.query(
        `SELECT status, COUNT(*) AS count 
         FROM applications 
         GROUP BY status`,
        (err, r3) => {
          if (err) return res.status(500).json(err);
          dashboard.applicationsByStatus = r3;

          // 4️⃣ Total Revenue (from payments)
          db.query(
            `
            SELECT IFNULL(SUM(p.amount),0) AS totalRevenue
            FROM payments p
            JOIN invoices i ON i.id = p.invoice_id
            WHERE i.status = 'Paid'
            `,
            (err, r4) => {
              if (err) return res.status(500).json(err);
              dashboard.totalRevenue = r4[0].totalRevenue;

              // 5️⃣ Pending Invoices
              db.query(
                "SELECT COUNT(*) AS pendingInvoices FROM invoices WHERE status='Unpaid'",
                (err, r5) => {
                  if (err) return res.status(500).json(err);
                  dashboard.pendingInvoices = r5[0].pendingInvoices;

                  // 6️⃣ Monthly Revenue (Last 6 Months)
                  db.query(
                    `SELECT 
                          DATE_FORMAT(payment_date, '%b') as month, 
                          SUM(amount) as total 
                         FROM payments 
                         WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                         GROUP BY YEAR(payment_date), MONTH(payment_date)
                         ORDER BY payment_date ASC`,
                    (err, r6) => {
                      if (err) return res.status(500).json(err);
                      dashboard.monthlyRevenue = r6;

                      // 7️⃣ Active Universities
                      db.query(
                        "SELECT COUNT(*) AS activeUniversities FROM universities WHERE is_active = 1",
                        (err, r7) => {
                          if (err) return res.status(500).json(err);
                          dashboard.activeUniversities = r7[0].activeUniversities;

                          // ✅ SEND RESPONSE ONCE
                          res.json(dashboard);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});
/* =========================
   GET ALL APPLICATIONS (ADMIN)
========================= */
router.get("/applications", auth, adminOnly, (req, res) => {
  db.query(
    `SELECT 
      a.id, 
      a.status, 
      a.counselor_remark,
      a.created_at,
      s.full_name AS student_name,
      u.name AS university_name,
      u.country AS university_country
     FROM applications a
     JOIN students s ON s.id = a.student_id
     JOIN universities u ON u.id = a.university_id
     ORDER BY a.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/* =========================
   GET ALL STUDENTS (ADMIN)
========================= */
router.get("/students", auth, adminOnly, (req, res) => {
  db.query(
    `SELECT 
      s.id, 
      s.full_name, 
      s.phone, 
      s.passport_no,
      s.nationality,
      u.email,
      g.guardian_name,
      g.relationship_to_student,
      g.guardian_phone,
      g.guardian_email,
      g.guardian_address
     FROM students s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN guardians g ON g.student_id = s.id
     ORDER BY s.id DESC`,
    (err, rows) => {
      if (err) {
        console.error("Students list error:", err);
        return res.status(500).json({ message: "Failed to fetch students" });
      }
      res.json(rows);
    }
  );
});

/* =========================
   GET ALL INVOICES (ADMIN)
========================= */
router.get("/invoices", auth, adminOnly, (req, res) => {
  db.query(
    `SELECT 
      i.id, 
      i.application_id, 
      i.amount, 
      i.status, 
      i.created_at,
      s.full_name AS student_name
     FROM invoices i
     LEFT JOIN applications a ON a.id = i.application_id
     LEFT JOIN students s ON s.id = a.student_id
     ORDER BY i.created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error("Invoices query error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

/* =========================
   GET ALL PAYMENTS (ADMIN)
========================= */
router.get("/payments", auth, adminOnly, (req, res) => {
  db.query(
    `SELECT 
      p.id, 
      p.invoice_id, 
      p.amount, 
      p.method, 
      p.payment_date,
      s.full_name AS student_name
     FROM payments p
     LEFT JOIN invoices i ON i.id = p.invoice_id
     LEFT JOIN applications a ON a.id = i.application_id
     LEFT JOIN students s ON s.id = a.student_id
     ORDER BY p.payment_date DESC`,
    (err, rows) => {
      if (err) {
        console.error("Payments query error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

/* =========================
   IELTS COURSES CRUD
========================= */
router.get("/ielts/courses", auth, adminOnly, (req, res) => {
  db.query(
    "SELECT * FROM ielts_courses ORDER BY start_date DESC",
    (err, rows) => {
      if (err) {
        console.error("Courses fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch courses" });
      }
      res.json(rows);
    }
  );
});

router.post("/ielts/courses/create", auth, adminOnly, (req, res) => {
  const { batch_name, instructor, start_date, end_date, description, duration, schedule, price } = req.body;

  if (!batch_name || !instructor || !start_date || !end_date) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  db.query(
    `INSERT INTO ielts_courses (batch_name, instructor, start_date, end_date, description, duration, schedule, price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [batch_name, instructor, start_date, end_date, description || '', duration || '8 weeks', schedule || 'Flexible', price || 0],
    (err, result) => {
      if (err) {
        console.error("Course creation error:", err);
        return res.status(500).json({ message: "Failed to create course" });
      }
      res.json({ message: "Course created successfully", course_id: result.insertId });
    }
  );
});

router.put("/ielts/courses/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;
  const { batch_name, instructor, start_date, end_date, description, duration, schedule, price } = req.body;

  const updates = [];
  const values = [];

  if (batch_name) { updates.push("batch_name = ?"); values.push(batch_name); }
  if (instructor) { updates.push("instructor = ?"); values.push(instructor); }
  if (start_date) { updates.push("start_date = ?"); values.push(start_date); }
  if (end_date) { updates.push("end_date = ?"); values.push(end_date); }

  // Optional fields update
  if (description !== undefined) { updates.push("description = ?"); values.push(description); }
  if (duration !== undefined) { updates.push("duration = ?"); values.push(duration); }
  if (schedule !== undefined) { updates.push("schedule = ?"); values.push(schedule); }
  if (price !== undefined) { updates.push("price = ?"); values.push(price); }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  values.push(id);

  db.query(
    `UPDATE ielts_courses SET ${updates.join(", ")} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        console.error("Course update error:", err);
        return res.status(500).json({ message: "Failed to update course" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json({ message: "Course updated successfully" });
    }
  );
});

// Delete course
router.delete("/ielts/courses/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM ielts_courses WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Course deletion error:", err);
        return res.status(500).json({ message: "Failed to delete course" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json({ message: "Course deleted successfully" });
    }
  );
});

/* =========================
   UNIVERSITIES CRUD
========================= */
// List all universities
router.get("/universities", auth, adminOnly, (req, res) => {
  db.query(
    "SELECT * FROM universities ORDER BY id ASC",
    (err, rows) => {
      if (err) {
        console.error("Universities list error:", err);
        return res.status(500).json({ message: "Failed to fetch universities" });
      }
      res.json(rows);
    }
  );
});

// Create university
router.post("/universities/create", auth, adminOnly, (req, res) => {
  const { name, country, requirements } = req.body;

  if (!name || !country || !requirements) {
    return res.status(400).json({ message: "Name, country, and requirements are required" });
  }

  db.query(
    "INSERT INTO universities (name, country, requirements) VALUES (?,?,?)",
    [name, country, requirements],
    (err, result) => {
      if (err) {
        console.error("University creation error:", err);
        return res.status(500).json({ message: "Failed to create university" });
      }
      res.json({ message: "University created successfully", id: result.insertId });
    }
  );
});

// Update university
router.put("/universities/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;
  const { name, country, requirements } = req.body;

  const updates = [];
  const values = [];

  if (name) { updates.push("name = ?"); values.push(name); }
  if (country) { updates.push("country = ?"); values.push(country); }
  if (requirements !== undefined) { updates.push("requirements = ?"); values.push(requirements); }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  values.push(id);

  db.query(
    `UPDATE universities SET ${updates.join(", ")} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        console.error("University update error:", err);
        return res.status(500).json({ message: "Failed to update university" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "University not found" });
      }
      res.json({ message: "University updated successfully" });
    }
  );
});

// Delete university
router.delete("/universities/:id", auth, adminOnly, (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM universities WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("University deletion error:", err);
        return res.status(500).json({ message: "Failed to delete university" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "University not found" });
      }
      res.json({ message: "University deleted successfully" });
    }
  );
});
module.exports = router;
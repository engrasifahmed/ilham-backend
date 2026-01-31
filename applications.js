const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");

const router = express.Router();

/* =========================
   STUDENT: APPLY TO UNIVERSITY
========================= */
router.post("/apply", auth, (req, res) => {
  const { university_id } = req.body;

  if (!university_id) {
    return res.status(400).json({ error: "university_id is required" });
  }

  db.query(
    "SELECT id FROM students WHERE user_id = ?",
    [req.userId],
    (err, studentResult) => {
      if (err) {
        console.error("Student lookup error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (studentResult.length === 0) {
        return res.status(400).json({ error: "Student profile not found" });
      }

      const studentId = studentResult[0].id;

      // Check for existing application
      db.query(
        "SELECT id, status FROM applications WHERE student_id = ? AND university_id = ?",
        [studentId, university_id],
        (err, existing) => {
          if (err) {
            console.error("Application check error:", err);
            return res.status(500).json({ error: "Database error" });
          }

          // If there's an existing application
          if (existing.length > 0) {
            const existingApp = existing[0];

            // If it's rejected, delete it to allow reapplication
            if (existingApp.status === 'Rejected') {
              db.query(
                "DELETE FROM applications WHERE id = ?",
                [existingApp.id],
                (err) => {
                  if (err) {
                    console.error("Failed to delete rejected application:", err);
                    return res.status(500).json({
                      error: "Failed to process reapplication"
                    });
                  }

                  console.log(`✅ Deleted rejected application ${existingApp.id} for reapplication`);

                  // Now create new application
                  db.query(
                    "INSERT INTO applications (student_id, university_id, status) VALUES (?,?,?)",
                    [studentId, university_id, "Applied"],
                    (err, result) => {
                      if (err) {
                        console.error("Application creation error:", err);
                        return res.status(500).json({ error: "Failed to create application" });
                      }
                      res.json({
                        message: "Application submitted",
                        application_id: result.insertId
                      });
                    }
                  );
                }
              );
              return; // Exit early, callback handles the rest
            } else {
              // Application is Applied or Approved - don't allow duplicate
              return res.status(400).json({
                error: `You already have a ${existingApp.status} application to this university`
              });
            }
          }

          // No existing application, create new one
          db.query(
            "INSERT INTO applications (student_id, university_id, status) VALUES (?,?,?)",
            [studentId, university_id, "Applied"],
            (err, result) => {
              if (err) {
                console.error("Application creation error:", err);
                return res.status(500).json({ error: "Failed to create application" });
              }
              res.json({
                message: "Application submitted",
                application_id: result.insertId
              });
            }
          );
        }
      );
    }
  );
});

/* =========================
   STUDENT: VIEW MY APPLICATIONS
========================= */
router.get("/my", auth, (req, res) => {
  db.query(
    `SELECT applications.*, universities.name AS university
     FROM applications
     JOIN students ON students.id = applications.student_id
     JOIN universities ON universities.id = applications.university_id
     WHERE students.user_id = ?`,
    [req.userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

/* =========================
   ADMIN: APPROVE / REJECT
========================= */
router.post("/status", auth, adminOnly, (req, res) => {
  const { application_id, status, counselor_remark } = req.body;

  if (!application_id || !status) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Allow all valid status transitions
  if (!["Applied", "Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be Applied, Approved, or Rejected" });
  }

  db.query(
    "UPDATE applications SET status=?, counselor_remark=? WHERE id=?",
    [status, counselor_remark || null, application_id],
    (err, result) => {
      if (err) {
        console.error("Application status update error:", err);
        return res.status(500).json({
          error: "Failed to update application status",
          message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Manually insert into history with changed_by
      // (Trigger handles the basic insert, but we want to track WHO changed it)
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

          // No automatic invoice creation - invoices must be created manually by admin
          res.json({
            message: `Application ${status.toLowerCase()} successfully`
          });
        }
      );
    }
  );
});

/* =========================
   GET APPLICATION HISTORY
========================= */
router.get("/:id/history", auth, (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT 
      ah.*,
      u.email as changed_by_email
    FROM application_history ah
    LEFT JOIN users u ON ah.changed_by = u.id
    WHERE ah.application_id = ?
    ORDER BY ah.changed_at ASC`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("Application history fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch application history" });
      }
      res.json(rows);
    }
  );
});

module.exports = router;

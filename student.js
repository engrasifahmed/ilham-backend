const express = require("express");
const db = require("./db");
const { auth } = require("./authMiddleware");

const router = express.Router();

/* =========================
   CREATE / UPDATE PROFILE
========================= */
router.post("/profile", auth, (req, res) => {
  const { full_name, phone, passport_no, nationality } = req.body;

  db.query(
    "SELECT id FROM students WHERE user_id=?",
    [req.userId],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        // UPDATE
        db.query(
          `UPDATE students 
           SET full_name=?, phone=?, passport_no=?, nationality=?
           WHERE user_id=?`,
          [full_name, phone, passport_no, nationality, req.userId],
          () => res.json({ message: "Profile updated" })
        );
      } else {
        // INSERT
        db.query(
          `INSERT INTO students (user_id, full_name, phone, passport_no, nationality)
           VALUES (?,?,?,?,?)`,
          [req.userId, full_name, phone, passport_no, nationality],
          () => res.json({ message: "Profile created" })
        );
      }
    }
  );
});
/* =========================
   EXTENDED STUDENT DASHBOARD
========================= */
router.get("/dashboard/full", auth, (req, res) => {
  const data = {};

  // Profile + passport + photo
  db.query(
    "SELECT full_name, phone, nationality, passport_no, photo_url FROM students WHERE user_id=?",
    [req.userId],
    (e1, r1) => {
      if (e1) return res.status(500).json(e1);
      data.profile = r1[0];

      // Applications + visa stats
      db.query(
        `SELECT status, COUNT(*) AS count
         FROM applications
         JOIN students ON students.id = applications.student_id
         WHERE students.user_id=?
         GROUP BY status`,
        [req.userId],
        (e2, r2) => {
          if (e2) return res.status(500).json(e2);
          data.applicationStatus = r2;

          // IELTS readiness
          db.query(
            `SELECT ROUND(AVG(overall),1) AS avgScore
             FROM ielts_results
             JOIN students ON students.id = ielts_results.student_id
             WHERE students.user_id=?`,
            [req.userId],
            (e3, r3) => {
              if (e3) return res.status(500).json(e3);
              const avg = r3[0].avgScore || 0;
              data.ielts = {
                average: avg,
                status: avg >= 6.5 ? "Eligible" : "Not Eligible"
              };

              // Upcoming mock tests
              db.query(
                `SELECT test_name, test_date
                 FROM ielts_mock_tests
                 WHERE test_date >= CURDATE()`,
                (e4, r4) => {
                  if (e4) return res.status(500).json(e4);
                  data.upcomingMocks = r4;

                  // Total mock tests
                  db.query(
                    "SELECT COUNT(*) AS totalMocks FROM ielts_mock_tests",
                    (e5, r5) => {
                      if (e5) return res.status(500).json(e5);
                      data.totalMockTests = r5[0].totalMocks;

                      res.json(data);
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
router.post("/guardian", auth, (req, res) => {
  const { guardian_name, relationship, phone, email, address } = req.body;

  db.query(
    "SELECT id FROM students WHERE user_id=?",
    [req.userId],
    (err, r) => {
      const studentId = r[0].id;

      db.query(
        `INSERT INTO guardians
         (student_id, guardian_name, relationship_to_student,
          guardian_phone, guardian_email, guardian_address)
         VALUES (?,?,?,?,?,?)`,
        [studentId, guardian_name, relationship, phone, email, address],
        () => res.json({ message: "Guardian saved" })
      );
    }
  );
});

module.exports = router;

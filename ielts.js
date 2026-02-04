const express = require("express");
const db = require("./db");
const { auth } = require("./authMiddleware"); // ✅ FIXED

const router = express.Router();

/* VIEW ALL IELTS BATCHES */
router.get("/courses", auth, (req, res) => {
  db.query("SELECT * FROM ielts_courses", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* ENROLL IN IELTS */
router.post("/enroll/:courseId", auth, (req, res) => {
  const courseId = req.params.courseId;

  db.query(
    "SELECT id FROM students WHERE user_id=?",
    [req.userId],
    (err, studentResult) => {
      if (!studentResult.length)
        return res.status(404).json({ error: "Student not found" });

      const studentId = studentResult[0].id;

      db.query(
        "INSERT INTO ielts_enrollments (student_id, course_id) VALUES (?,?)",
        [studentId, courseId],
        () => res.json({ message: "Enrolled successfully" })
      );
    }
  );
});

/* MY IELTS ENROLLMENTS */
router.get("/my", auth, (req, res) => {
  db.query(
    `SELECT ielts_courses.*
     FROM ielts_enrollments
     JOIN students ON students.id = ielts_enrollments.student_id
     JOIN ielts_courses ON ielts_courses.id = ielts_enrollments.course_id
     WHERE students.user_id=?`,
    [req.userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});
/* =========================
   FREE IELTS MATERIALS (PUBLIC)
========================= */
router.get("/free-materials", (req, res) => {
  db.query(
    "SELECT * FROM free_ielts_materials",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

/* =========================
   ALL IELTS MATERIALS (STUDENT)
========================= */
router.get("/materials", auth, (req, res) => {
  db.query(
    "SELECT * FROM ielts_materials ORDER BY created_at DESC",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

/* =========================
   IELTS RESULTS (STUDENT)
========================= */
router.get("/results", auth, (req, res) => {
  // Get student ID first
  db.query("SELECT id FROM students WHERE user_id = ?", [req.userId], (err, sResult) => {
    if (err) return res.status(500).json(err);
    if (!sResult.length) return res.status(404).json({ message: "Student not found" });

    const studentId = sResult[0].id;

    db.query(
      "SELECT * FROM ielts_results WHERE student_id = ? ORDER BY date_taken DESC",
      [studentId],
      (rErr, rows) => {
        if (rErr) return res.status(500).json(rErr);
        res.json(rows);
      }
    );
  });
});

module.exports = router;

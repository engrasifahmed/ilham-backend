const express = require("express");
const db = require("./db");
const { auth } = require("./authMiddleware"); // ✅ FIXED

const router = express.Router();

/* VIEW MOCK TESTS FOR A COURSE */
router.get("/tests/:courseId", auth, (req, res) => {
  db.query(
    "SELECT * FROM ielts_mock_tests WHERE course_id=?",
    [req.params.courseId],
    (err, result) => res.json(result)
  );
});

/* VIEW MY RESULTS */
router.get("/results", auth, (req, res) => {
  db.query(
    `SELECT ielts_results.*, ielts_mock_tests.test_name
     FROM ielts_results
     JOIN students ON students.id = ielts_results.student_id
     JOIN ielts_mock_tests ON ielts_mock_tests.id = ielts_results.mock_test_id
     WHERE students.user_id=?`,
    [req.userId],
    (err, result) => res.json(result)
  );
});

/* CHECK IELTS READINESS */
router.get("/readiness", auth, (req, res) => {
  db.query(
    `SELECT AVG(overall) AS avg_score
     FROM ielts_results
     JOIN students ON students.id = ielts_results.student_id
     WHERE students.user_id=?`,
    [req.userId],
    (err, result) => {
      const score = Number(result[0].avg_score || 0).toFixed(1);
      const status = score >= 6.5 ? "Eligible" : "Not Eligible";
      res.json({ average: score, status });
    }
  );
});

module.exports = router;

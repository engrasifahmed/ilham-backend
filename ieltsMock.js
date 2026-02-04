const express = require("express");
const db = require("./db");
const { auth } = require("./authMiddleware"); // ✅ FIXED

const router = express.Router();

/* VIEW MOCK TESTS LIST */
router.get("/list", auth, (req, res) => {
  db.query("SELECT * FROM ielts_mock_tests ORDER BY created_at DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* GET TEST QUESTIONS */
router.get("/take/:testId", auth, (req, res) => {
  const testId = req.params.testId;

  // 1. Get Test Info
  db.query("SELECT * FROM ielts_mock_tests WHERE id=?", [testId], (err, testRes) => {
    if (err || testRes.length === 0) return res.status(404).json({ error: "Test not found" });

    const testInfo = testRes[0];

    // 2. Get Questions (exclude correct_answer for security)
    db.query(
      `SELECT id, section, question_text, options_json, points 
       FROM ielts_mock_questions 
       WHERE test_id=? ORDER BY section, id`,
      [testId],
      (qErr, qRes) => {
        if (qErr) return res.status(500).json(qErr);

        res.json({ test: testInfo, questions: qRes });
      }
    );
  });
});

/* SUBMIT TEST ANSWERS */
router.post("/submit", auth, (req, res) => {
  const { testId, answers } = req.body; // answers: { questionId: "User Answer" }
  const userId = req.userId;

  // 1. Get Student ID
  db.query("SELECT id FROM students WHERE user_id=?", [userId], (err, sRes) => {
    if (err || sRes.length === 0) return res.status(404).json({ error: "Student not found" });
    const studentId = sRes[0].id;

    // 2. Fetch Correct Answers from DB
    db.query("SELECT id, correct_answer, section, points FROM ielts_mock_questions WHERE test_id=?", [testId], (qErr, questions) => {
      if (qErr) return res.status(500).json(qErr);

      // 3. Calculate Score
      let scoreListening = 0;
      let scoreReading = 0;
      let scoreWriting = 0; // Manual grading usually, but we'll auto-grade exact matches for now or just 0
      let scoreSpeaking = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      questions.forEach(q => {
        const userAns = answers[q.id];
        // Simple case-insensitive match
        // In real world, regex or manual grading is needed for Writing/Speaking
        if (userAns && userAns.toLowerCase().trim() === (q.correct_answer || "").toLowerCase().trim()) {
          earnedPoints += q.points;
          if (q.section === 'Listening') scoreListening += q.points;
          if (q.section === 'Reading') scoreReading += q.points;
        }
        totalPoints += q.points;
      });

      // Simplified Band Score Calculation (Dummy Logic: Percentage / 10 * 9)
      const calculateBand = (score, max) => max === 0 ? 0 : Math.round((score / max * 9) * 2) / 2;

      // For this mock, we only auto-grade Listening/Reading. Writing/Speaking set to 0 or manual.
      const bandL = calculateBand(scoreListening, questions.filter(q => q.section === 'Listening').length * 1 || 1);
      const bandR = calculateBand(scoreReading, questions.filter(q => q.section === 'Reading').length * 1 || 1);
      const bandW = 0; // Pending manual review
      const bandS = 0; // Pending manual review
      const overall = (bandL + bandR + bandW + bandS) / 4;

      // 4. Save Results
      db.query(
        `INSERT INTO ielts_results (student_id, mock_test_id, overall, listening, reading, writing, speaking)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentId, testId, overall, bandL, bandR, bandW, bandS],
        (saveErr) => {
          if (saveErr) return res.status(500).json(saveErr);
          res.json({
            message: "Test submitted successfully",
            results: { overall, listening: bandL, reading: bandR }
          });
        }
      );
    });
  });
});

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

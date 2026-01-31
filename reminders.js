const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");

const router = express.Router();

/* =========================
   GET ALL REMINDERS (ADMIN)
========================= */
router.get("/", auth, adminOnly, (req, res) => {
  db.query(
    `
    SELECT 
      r.id,
      r.student_id,
      r.title,
      r.note,
      r.remind_date,
      s.full_name AS student_name
    FROM reminders r
    JOIN students s ON s.id = r.student_id
    ORDER BY r.remind_date ASC
    `,
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load reminders" });
      }
      res.json(rows);
    }
  );
});
/* =========================
   PUSH REMINDER (ADMIN)
========================= */
router.post("/push", auth, adminOnly, (req, res) => {
  const { student_id, note } = req.body;

  if (!student_id || !note) {
    return res.status(400).json({ message: "Missing data" });
  }

  db.query(
    `
    INSERT INTO notifications (student_id, message, is_read, created_at)
    VALUES (?, ?, 0, NOW())
    `,
    [student_id, note],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to push reminder" });
      }
      res.json({ message: "Reminder pushed successfully" });
    }
  );
});

module.exports = router;

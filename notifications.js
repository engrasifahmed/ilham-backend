const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");

const router = express.Router();

/* GET ALL NOTIFICATIONS */
router.get("/", auth, adminOnly, (req, res) => {
  db.query(
    "SELECT * FROM notifications ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/* MARK AS READ */
router.put("/:id/read", auth, adminOnly, (req, res) => {
  db.query(
    "UPDATE notifications SET is_read=1 WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Marked as read" })
  );
});

/* DELETE */
router.delete("/:id", auth, adminOnly, (req, res) => {
  db.query(
    "DELETE FROM notifications WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Deleted" })
  );
});

/* =========================
   STUDENT NOTIFICATIONS
========================= */

/* GET MY NOTIFICATIONS */
router.get("/my", auth, (req, res) => {
  const userId = req.userId;

  // 1. Get student ID
  db.query("SELECT id FROM students WHERE user_id = ?", [userId], (err, sResult) => {
    if (err) return res.status(500).json(err);
    if (sResult.length === 0) return res.status(404).json({ message: "Student not found" });

    const studentId = sResult[0].id;

    // 2. Get notifications
    db.query(
      "SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC",
      [studentId],
      (nErr, rows) => {
        if (nErr) return res.status(500).json(nErr);
        res.json(rows);
      }
    );
  });
});

/* MARK MY NOTIFICATION AS READ */
router.put("/my/:id/read", auth, (req, res) => {
  const notifId = req.params.id;
  const userId = req.userId;

  // Verify ownership via join or subquery? 
  // Simplify: Get student ID first
  db.query("SELECT id FROM students WHERE user_id = ?", [userId], (err, sResult) => {
    if (err || sResult.length === 0) return res.status(403).json({ message: "Access denied" });

    const studentId = sResult[0].id;

    // Update if belongs to student
    db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND student_id = ?",
      [notifId, studentId],
      (updateErr, result) => {
        if (updateErr) return res.status(500).json(updateErr);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Notification not found" });
        res.json({ message: "Marked as read" });
      }
    );
  });
});

/* MARK ALL AS READ */
router.put("/my/read-all", auth, (req, res) => {
  const userId = req.userId;

  db.query("SELECT id FROM students WHERE user_id = ?", [userId], (err, sResult) => {
    if (err || sResult.length === 0) return res.status(403).json({ message: "Access denied" });
    const studentId = sResult[0].id;

    db.query(
      "UPDATE notifications SET is_read = 1 WHERE student_id = ?",
      [studentId],
      (updateErr) => {
        if (updateErr) return res.status(500).json(updateErr);
        res.json({ message: "All marked as read" });
      }
    );
  });
});


module.exports = router;

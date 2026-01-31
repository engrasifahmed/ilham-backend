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

module.exports = router;

const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");

const router = express.Router();

/* =========================
   TEST ROUTE (DEBUG)
========================= */
router.get("/test", (req, res) => {
  res.json({ billing: "billing router working" });
});

/* =========================
   STUDENT: VIEW MY INVOICES
========================= */
router.get("/invoices", auth, (req, res) => {
  db.query(
    `SELECT 
       i.*,
       a.university_id,
       u.name AS university_name,
       u.country AS university_country
     FROM invoices i
     JOIN applications a ON a.id = i.application_id
     JOIN students s ON s.id = a.student_id
     JOIN universities u ON u.id = a.university_id
     WHERE s.user_id = ?
     ORDER BY i.created_at DESC`,
    [req.userId],
    (err, result) => {
      if (err) {
        console.error("Invoices fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch invoices" });
      }
      res.json(result);
    }
  );
});

/* =========================
   STUDENT: VIEW MY PAYMENTS
========================= */
router.get("/payments", auth, (req, res) => {
  db.query(
    `SELECT 
       p.*,
       i.amount AS invoice_amount,
       i.status AS invoice_status,
       u.name AS university_name
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     JOIN applications a ON a.id = i.application_id
     JOIN students s ON s.id = a.student_id
     JOIN universities u ON u.id = a.university_id
     WHERE s.user_id = ?
     ORDER BY p.payment_date DESC`,
    [req.userId],
    (err, result) => {
      if (err) {
        console.error("Payments fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch payments" });
      }
      res.json(result);
    }
  );
});

/* =========================
   ADMIN: RECORD PAYMENT
========================= */
router.post("/payment", auth, adminOnly, (req, res) => {
  const { invoice_id, amount, method, payment_date, notes } = req.body;

  if (!invoice_id || !amount || !method) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Insert payment
  db.query(
    "INSERT INTO payments (invoice_id, amount, method, payment_date, notes) VALUES (?,?,?,?,?)",
    [invoice_id, amount, method, payment_date || new Date(), notes || null],
    (err) => {
      if (err) return res.status(500).json(err);

      // Update invoice status to Paid
      db.query(
        "UPDATE invoices SET status='Paid' WHERE id=?",
        [invoice_id],
        (err) => {
          if (err) return res.status(500).json(err);

          // Auto-delete related reminders for this invoice
          db.query(
            `DELETE FROM reminders 
             WHERE note LIKE CONCAT('%invoice #', ?, '%') 
             OR note LIKE CONCAT('%invoice%', ?, '%')`,
            [invoice_id, invoice_id],
            (err) => {
              if (err) console.error("Reminder deletion error:", err);
              // Don't fail the payment if reminder deletion fails
              res.json({
                message: "Payment recorded, invoice marked as paid, and reminders auto-deleted"
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;

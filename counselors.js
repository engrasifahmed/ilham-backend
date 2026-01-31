const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");

const router = express.Router();

/* =========================
   ASSIGN COUNSELOR TO STUDENT
========================= */
router.post("/assign", auth, adminOnly, (req, res) => {
    const { student_id, counselor_id } = req.body;

    if (!student_id || !counselor_id) {
        return res.status(400).json({ message: "Student ID and Counselor ID are required" });
    }

    // First, verify the counselor is actually a counselor
    db.query(
        "SELECT id, role FROM users WHERE id = ? AND role = 'COUNSELOR'",
        [counselor_id],
        (err, counselorRows) => {
            if (err) {
                console.error("Counselor verification error:", err);
                return res.status(500).json({ message: "Failed to verify counselor" });
            }

            if (counselorRows.length === 0) {
                return res.status(400).json({ message: "Invalid counselor ID or user is not a counselor" });
            }

            // Deactivate any existing active assignments for this student
            db.query(
                "UPDATE counselor_assignments SET is_active = 0 WHERE student_id = ? AND is_active = 1",
                [student_id],
                (err) => {
                    if (err) {
                        console.error("Deactivation error:", err);
                        return res.status(500).json({ message: "Failed to update existing assignments" });
                    }

                    // Create new assignment
                    db.query(
                        `INSERT INTO counselor_assignments (student_id, counselor_id, assigned_at, is_active)
             VALUES (?, ?, NOW(), 1)`,
                        [student_id, counselor_id],
                        (err, result) => {
                            if (err) {
                                console.error("Assignment creation error:", err);
                                return res.status(500).json({ message: "Failed to assign counselor" });
                            }
                            res.json({
                                message: "Counselor assigned successfully",
                                assignment_id: result.insertId
                            });
                        }
                    );
                }
            );
        }
    );
});

/* =========================
   GET ALL STUDENTS FOR A COUNSELOR
========================= */
router.get("/students/:counselorId", auth, (req, res) => {
    const { counselorId } = req.params;
    const { include_inactive } = req.query;

    let query = `
    SELECT 
      ca.id as assignment_id,
      ca.assigned_at,
      ca.is_active,
      s.id as student_id,
      s.full_name,
      s.email,
      s.phone,
      s.passport_no,
      s.nationality
    FROM counselor_assignments ca
    JOIN students s ON ca.student_id = s.id
    WHERE ca.counselor_id = ?
  `;

    if (!include_inactive || include_inactive === 'false') {
        query += " AND ca.is_active = 1";
    }

    query += " ORDER BY ca.assigned_at DESC";

    db.query(query, [counselorId], (err, rows) => {
        if (err) {
            console.error("Students fetch error:", err);
            return res.status(500).json({ message: "Failed to fetch students" });
        }
        res.json(rows);
    });
});

/* =========================
   GET ASSIGNED COUNSELOR FOR A STUDENT
========================= */
router.get("/student/:studentId", auth, (req, res) => {
    const { studentId } = req.params;

    db.query(
        `SELECT 
      ca.id as assignment_id,
      ca.assigned_at,
      ca.is_active,
      u.id as counselor_id,
      u.email as counselor_email
    FROM counselor_assignments ca
    JOIN users u ON ca.counselor_id = u.id
    WHERE ca.student_id = ? AND ca.is_active = 1
    ORDER BY ca.assigned_at DESC
    LIMIT 1`,
        [studentId],
        (err, rows) => {
            if (err) {
                console.error("Counselor fetch error:", err);
                return res.status(500).json({ message: "Failed to fetch counselor" });
            }
            if (rows.length === 0) {
                return res.json({ message: "No active counselor assigned", counselor: null });
            }
            res.json(rows[0]);
        }
    );
});

/* =========================
   UPDATE ASSIGNMENT STATUS
========================= */
router.put("/assignment/:id", auth, adminOnly, (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
        return res.status(400).json({ message: "is_active field is required" });
    }

    db.query(
        "UPDATE counselor_assignments SET is_active = ? WHERE id = ?",
        [is_active ? 1 : 0, id],
        (err, result) => {
            if (err) {
                console.error("Assignment update error:", err);
                return res.status(500).json({ message: "Failed to update assignment" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Assignment not found" });
            }
            res.json({ message: "Assignment updated successfully" });
        }
    );
});

/* =========================
   GET ALL COUNSELORS
========================= */
router.get("/list", auth, adminOnly, (req, res) => {
    db.query(
        `SELECT 
      u.id,
      u.email,
      u.is_verified,
      COUNT(ca.id) as active_students
    FROM users u
    LEFT JOIN counselor_assignments ca ON u.id = ca.counselor_id AND ca.is_active = 1
    WHERE u.role = 'COUNSELOR'
    GROUP BY u.id, u.email, u.is_verified
    ORDER BY u.email ASC`,
        (err, rows) => {
            if (err) {
                console.error("Counselors list error:", err);
                return res.status(500).json({ message: "Failed to fetch counselors" });
            }
            res.json(rows);
        }
    );
});

/* =========================
   GET ALL ASSIGNMENTS (ADMIN)
========================= */
router.get("/assignments", auth, adminOnly, (req, res) => {
    const { is_active } = req.query;

    let query = `
    SELECT 
      ca.id as assignment_id,
      ca.assigned_at,
      ca.is_active,
      s.id as student_id,
      s.full_name as student_name,
      s.email as student_email,
      u.id as counselor_id,
      u.email as counselor_email
    FROM counselor_assignments ca
    JOIN students s ON ca.student_id = s.id
    JOIN users u ON ca.counselor_id = u.id
    WHERE 1=1
  `;

    const params = [];

    if (is_active !== undefined) {
        query += " AND ca.is_active = ?";
        params.push(is_active === 'true' ? 1 : 0);
    }

    query += " ORDER BY ca.assigned_at DESC";

    db.query(query, params, (err, rows) => {
        if (err) {
            console.error("Assignments list error:", err);
            return res.status(500).json({ message: "Failed to fetch assignments" });
        }
        res.json(rows);
    });
});

/* =========================
   DELETE ASSIGNMENT (ADMIN)
========================= */
router.delete("/assignment/:id", auth, adminOnly, (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM counselor_assignments WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error("Assignment deletion error:", err);
                return res.status(500).json({ message: "Failed to delete assignment" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Assignment not found" });
            }
            res.json({ message: "Assignment deleted successfully" });
        }
    );
});

module.exports = router;

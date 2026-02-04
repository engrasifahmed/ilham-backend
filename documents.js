const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer Configuration for Documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public/uploads/documents");
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and Word documents are allowed!'));
        }
    }
});

/* =========================
   UPLOAD STUDENT DOCUMENT
========================= */
/* =========================
   UPLOAD STUDENT DOCUMENT
========================= */
router.post("/upload", auth, upload.single('file'), (req, res) => {
    let { student_id, document_type, document_name } = req.body;

    // Check permissions
    if (req.role !== 'ADMIN') {
        // If not admin, can only upload for self
        if (student_id) {
            // If they sent student_id, ignore it or check it matches? 
            // Better to just look it up.
        }
    }

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    if (!document_type) {
        return res.status(400).json({ message: "Document type is required" });
    }

    const processUpload = (targetStudentId) => {
        const file_url = `/uploads/documents/${req.file.filename}`;
        const finalDocumentName = document_name || req.file.originalname;

        db.query(
            `INSERT INTO student_documents (student_id, document_type, document_name, file_url, uploaded_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [targetStudentId, document_type, finalDocumentName, file_url],
            (err, result) => {
                if (err) {
                    console.error("Document upload error:", err);
                    return res.status(500).json({ message: "Failed to upload document", error: err.message });
                }
                res.json({
                    message: "Document uploaded successfully",
                    document_id: result.insertId,
                    file_url: file_url
                });
            }
        );
    };

    if (req.role === 'ADMIN') {
        if (!student_id) {
            return res.status(400).json({ message: "Student ID is required for admin upload" });
        }
        processUpload(student_id);
    } else {
        // User is a student, look up their ID
        db.query("SELECT id FROM students WHERE user_id = ?", [req.userId], (err, rows) => {
            if (err || rows.length === 0) {
                return res.status(404).json({ message: "Student profile not found" });
            }
            processUpload(rows[0].id);
        });
    }
});

/* =========================
   GET MY DOCUMENTS (STUDENT)
========================= */
router.get("/my-documents", auth, (req, res) => {
    const userId = req.userId;

    db.query("SELECT id FROM students WHERE user_id = ?", [userId], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ message: "Student profile not found" });
        }
        const studentId = rows[0].id;

        db.query(
            `SELECT 
              d.*,
              u.email as verified_by_email
             FROM student_documents d
             LEFT JOIN users u ON d.verified_by = u.id
             WHERE d.student_id = ?
             ORDER BY d.uploaded_at DESC`,
            [studentId],
            (err, docs) => {
                if (err) {
                    console.error("Documents fetch error:", err);
                    return res.status(500).json({ message: "Failed to fetch documents" });
                }
                res.json(docs);
            }
        );
    });
});

/* =========================
   GET ALL DOCUMENTS FOR A STUDENT (ADMIN/Shared)
========================= */
router.get("/student/:studentId", auth, (req, res) => {
    const { studentId } = req.params;

    db.query(
        `SELECT 
      d.*,
      u.email as verified_by_email
     FROM student_documents d
     LEFT JOIN users u ON d.verified_by = u.id
     WHERE d.student_id = ?
     ORDER BY d.uploaded_at DESC`,
        [studentId],
        (err, rows) => {
            if (err) {
                console.error("Documents fetch error:", err);
                return res.status(500).json({ message: "Failed to fetch documents" });
            }
            res.json(rows);
        }
    );
});

/* =========================
   GET SPECIFIC DOCUMENT
========================= */
router.get("/:id", auth, (req, res) => {
    const { id } = req.params;

    db.query(
        `SELECT 
      d.*,
      s.full_name as student_name,
      s.email as student_email,
      u.email as verified_by_email
     FROM student_documents d
     JOIN students s ON d.student_id = s.id
     LEFT JOIN users u ON d.verified_by = u.id
     WHERE d.id = ?`,
        [id],
        (err, rows) => {
            if (err) {
                console.error("Document fetch error:", err);
                return res.status(500).json({ message: "Failed to fetch document" });
            }
            if (rows.length === 0) {
                return res.status(404).json({ message: "Document not found" });
            }
            res.json(rows[0]);
        }
    );
});

/* =========================
   VERIFY DOCUMENT (ADMIN)
========================= */
router.put("/:id/verify", auth, adminOnly, (req, res) => {
    const { id } = req.params;
    const adminId = req.userId; // Fixed: use req.userId

    // 1. Get document details first
    db.query("SELECT * FROM student_documents WHERE id = ?", [id], (err, rows) => {
        if (err) {
            console.error("Doc fetch error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (rows.length === 0) {
            return res.status(404).json({ message: "Document not found" });
        }
        const doc = rows[0];

        // 2. Update status
        db.query(
            `UPDATE student_documents 
             SET verified = 1, verified_by = ?, verified_at = NOW()
             WHERE id = ?`,
            [adminId, id],
            (updateErr) => {
                if (updateErr) {
                    console.error("Verify error:", updateErr);
                    return res.status(500).json({ message: "Failed to verify document" });
                }

                // 3. Send Notification
                const message = `Your document '${doc.document_name}' has been verified.`;
                db.query(
                    "INSERT INTO notifications (student_id, message, is_read, created_at) VALUES (?, ?, 0, NOW())",
                    [doc.student_id, message],
                    (notifErr) => {
                        if (notifErr) console.error("Notification error:", notifErr);
                        // Respond success even if notification fails
                        res.json({ message: "Document verified successfully" });
                    }
                );
            }
        );
    });
});

/* =========================
   UNVERIFY DOCUMENT (ADMIN)
========================= */
router.put("/:id/unverify", auth, adminOnly, (req, res) => {
    const { id } = req.params;

    db.query(
        `UPDATE student_documents 
     SET verified = 0, verified_by = NULL, verified_at = NULL
     WHERE id = ?`,
        [id],
        (err, result) => {
            if (err) {
                console.error("Document unverification error:", err);
                return res.status(500).json({ message: "Failed to unverify document" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Document not found" });
            }
            res.json({ message: "Document unverified successfully" });
        }
    );
});

/* =========================
   DELETE DOCUMENT (ADMIN)
========================= */
/* =========================
   DELETE DOCUMENT
========================= */
router.delete("/:id", auth, (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.role;

    // First get the document
    db.query(
        `SELECT d.*, s.user_id as student_user_id 
         FROM student_documents d
         JOIN students s ON d.student_id = s.id
         WHERE d.id = ?`,
        [id],
        (err, rows) => {
            if (err) {
                console.error("Document fetch error:", err);
                return res.status(500).json({ message: "Failed to fetch document" });
            }
            if (rows.length === 0) {
                return res.status(404).json({ message: "Document not found" });
            }

            const doc = rows[0];

            // Permission check
            if (userRole !== 'ADMIN') {
                // Formatting note: doc.student_user_id (from DB) vs userId (from token)
                if (doc.student_user_id !== userId) {
                    return res.status(403).json({ message: "Access denied" });
                }
                // Students cannot delete verified documents
                if (doc.verified) {
                    return res.status(403).json({ message: "Cannot delete verified documents" });
                }
            }

            const fileUrl = doc.file_url;
            const filePath = path.join(__dirname, "public", fileUrl);

            // Delete from database
            db.query(
                "DELETE FROM student_documents WHERE id = ?",
                [id],
                (err, result) => {
                    if (err) {
                        console.error("Document deletion error:", err);
                        return res.status(500).json({ message: "Failed to delete document" });
                    }

                    // Delete physical file
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }

                    res.json({ message: "Document deleted successfully" });
                }
            );
        }
    );
});

/* =========================
   GET ALL DOCUMENTS (ADMIN)
========================= */
router.get("/", auth, adminOnly, (req, res) => {
    const { student_id, document_type, verified } = req.query;

    let query = `
    SELECT 
      d.*,
      s.full_name as student_name,
      s.email as student_email,
      u.email as verified_by_email
    FROM student_documents d
    JOIN students s ON d.student_id = s.id
    LEFT JOIN users u ON d.verified_by = u.id
    WHERE 1=1
  `;
    const params = [];

    if (student_id) {
        query += " AND d.student_id = ?";
        params.push(student_id);
    }

    if (document_type) {
        query += " AND d.document_type = ?";
        params.push(document_type);
    }

    if (verified !== undefined) {
        query += " AND d.verified = ?";
        params.push(verified === 'true' ? 1 : 0);
    }

    query += " ORDER BY d.uploaded_at DESC";

    db.query(query, params, (err, rows) => {
        if (err) {
            console.error("Documents list error:", err);
            return res.status(500).json({ message: "Failed to fetch documents" });
        }
        res.json(rows);
    });
});

module.exports = router;

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
router.post("/upload", auth, adminOnly, upload.single('file'), (req, res) => {
    const { student_id, document_type, document_name } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    if (!student_id || !document_type) {
        return res.status(400).json({ message: "Student ID and document type are required" });
    }

    const file_url = `/uploads/documents/${req.file.filename}`;
    const finalDocumentName = document_name || req.file.originalname;

    db.query(
        `INSERT INTO student_documents (student_id, document_type, document_name, file_url, uploaded_at)
     VALUES (?, ?, ?, ?, NOW())`,
        [student_id, document_type, finalDocumentName, file_url],
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
});

/* =========================
   GET ALL DOCUMENTS FOR A STUDENT
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
    const userId = req.user.id; // From auth middleware

    db.query(
        `UPDATE student_documents 
     SET verified = 1, verified_by = ?, verified_at = NOW()
     WHERE id = ?`,
        [userId, id],
        (err, result) => {
            if (err) {
                console.error("Document verification error:", err);
                return res.status(500).json({ message: "Failed to verify document" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Document not found" });
            }
            res.json({ message: "Document verified successfully" });
        }
    );
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
router.delete("/:id", auth, adminOnly, (req, res) => {
    const { id } = req.params;

    // First get the file path to delete the physical file
    db.query(
        "SELECT file_url FROM student_documents WHERE id = ?",
        [id],
        (err, rows) => {
            if (err) {
                console.error("Document fetch error:", err);
                return res.status(500).json({ message: "Failed to fetch document" });
            }
            if (rows.length === 0) {
                return res.status(404).json({ message: "Document not found" });
            }

            const fileUrl = rows[0].file_url;
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

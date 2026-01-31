const express = require("express");
const db = require("./db");
const { auth, adminOnly } = require("./authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public/uploads/materials");
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

const upload = multer({ storage: storage });

/* =========================
   IELTS MATERIALS CRUD
========================= */

// List all materials
router.get("/materials", auth, adminOnly, (req, res) => {
    db.query(
        `SELECT m.*, c.batch_name as course_name 
     FROM ielts_materials m 
     LEFT JOIN ielts_courses c ON m.course_id = c.id 
     ORDER BY m.created_at DESC`,
        (err, rows) => {
            if (err) {
                console.error("Materials list error:", err);
                return res.status(500).json({ message: "Failed to fetch materials" });
            }
            res.json(rows);
        }
    );
});

// Create material
router.post("/materials/create", auth, adminOnly, upload.single('file'), (req, res) => {
    const { title, description, material_type, course_id, is_free } = req.body;
    let file_url = req.body.file_url;

    if (req.file) {
        file_url = `/uploads/materials/${req.file.filename}`;
    }

    if (!title || !material_type || !file_url) {
        return res.status(400).json({ message: "Missing required fields (Title, Type, and File/URL)" });
    }

    db.query(
        "INSERT INTO ielts_materials (title, description, material_type, file_url, course_id, is_free) VALUES (?,?,?,?,?,?)",
        [title, description, material_type, file_url, course_id, is_free ? 1 : 0],
        (err, result) => {
            if (err) {
                console.error("Material creation error:", err);
                return res.status(500).json({ message: "Failed to create material" });
            }
            res.json({ message: "Material created successfully", id: result.insertId });
        }
    );
});

// Update material
router.put("/materials/:id", auth, adminOnly, upload.single('file'), (req, res) => {
    const { id } = req.params;
    const { title, description, is_free } = req.body;
    let file_url = req.body.file_url;

    if (req.file) {
        file_url = `/uploads/materials/${req.file.filename}`;
    }

    const updates = [];
    const values = [];

    if (title) { updates.push("title = ?"); values.push(title); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (file_url) { updates.push("file_url = ?"); values.push(file_url); }
    if (is_free !== undefined) { updates.push("is_free = ?"); values.push(is_free ? 1 : 0); }

    if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    db.query(
        `UPDATE ielts_materials SET ${updates.join(", ")} WHERE id = ?`,
        values,
        (err, result) => {
            if (err) {
                console.error("Material update error:", err);
                return res.status(500).json({ message: "Failed to update material" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Material not found" });
            }
            res.json({ message: "Material updated successfully" });
        }
    );
});

// Delete material
router.delete("/materials/:id", auth, adminOnly, (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM ielts_materials WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error("Material deletion error:", err);
                return res.status(500).json({ message: "Failed to delete material" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Material not found" });
            }
            res.json({ message: "Material deleted successfully" });
        }
    );
});

module.exports = router;

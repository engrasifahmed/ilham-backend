const express = require('express');
const router = express.Router();
const db = require('./db');
const { auth, adminOnly } = require('./authMiddleware');

/* =========================
   PUBLIC: GET ALL CONTENT
========================= */
router.get("/public/content", (req, res) => {
    db.query("SELECT section_key, content_value FROM site_content", (err, rows) => {
        if (err) {
            console.error("Fetch content error:", err);
            return res.status(500).json({ error: "Failed to fetch content" });
        }

        // Convert array to object { key: value }
        const content = {};
        rows.forEach(row => {
            content[row.section_key] = row.content_value;
        });

        res.json(content);
    });
});

/* =========================
   PUBLIC: GET UNIVERSITIES & IELTS
========================= */
router.get("/public/universities", (req, res) => {
    const query = "SELECT name, country, ielts_requirement FROM universities LIMIT 6";
    db.query(query, (err, rows) => {
        if (err) {
            console.error("Universities DB Error:", err);
            return res.json([]);
        }
        res.json(rows);
    });
});

router.get("/public/ielts", async (req, res) => {
    try {
        const [courses] = await db.promise().query("SELECT batch_name, start_date FROM ielts_courses WHERE status='Active' LIMIT 3").catch(() => [[], []]);

        // Fix: Map 'file_url' to 'link' and 'material_type' to 'type'
        const [materials] = await db.promise().query("SELECT title, file_url AS link, material_type AS type FROM ielts_materials LIMIT 3").catch(e => {
            console.error("Materials DB Error:", e);
            return [[], []];
        });

        res.json({ courses: courses || [], materials: materials || [] });
    } catch (err) {
        console.error("IELTS Route Error:", err);
        res.json({ courses: [], materials: [] });
    }
});

/* =========================
   ADMIN: UPDATE CONTENT
========================= */
router.post("/admin/content", auth, adminOnly, (req, res) => {
    const updates = req.body; // Expect { key1: val1, key2: val2 }

    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No updates provided" });
    }

    // Process updates sequentially or loosely (using ON DUPLICATE KEY UPDATE)
    // We'll iterate and fire queries. For a CMS with few keys, this is fine.

    const keys = Object.keys(updates);
    let completed = 0;
    let errors = 0;

    keys.forEach(key => {
        const val = updates[key];
        const query = `
            INSERT INTO site_content (section_key, content_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE content_value = ?
        `;

        db.query(query, [key, val, val], (err) => {
            if (err) {
                console.error(`Error updating ${key}:`, err);
                errors++;
            }
            completed++;

            if (completed === keys.length) {
                if (errors > 0) {
                    res.status(500).json({ message: "Updated with some errors", errors });
                } else {
                    res.json({ message: "Content updated successfully" });
                }
            }
        });
    });
});

module.exports = router;

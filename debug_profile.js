const db = require('./db');

async function debugProfile() {
    console.log("=== Debugging Profile Update ===");

    // 1. Check Columns
    db.query("SHOW COLUMNS FROM students", (err, cols) => {
        if (err) { console.error("SHOW FIELDS Error:", err); return; }

        const fields = cols.map(c => c.Field);
        console.log("Columns:", fields);

        const required = ['dob', 'phone', 'address', 'passport_no', 'ielts_score'];
        const missing = required.filter(f => !fields.includes(f));

        if (missing.length > 0) {
            console.error("CRITICAL: Missing columns:", missing);
        } else {
            console.log("All columns present.");
        }

        // 2. Try Dummy Update
        // Pick first student
        db.query("SELECT id FROM students LIMIT 1", (err2, rows) => {
            if (err2) { console.error("Select student error:", err2); return; }
            if (rows.length === 0) { console.log("No students found to test."); return; }

            const id = rows[0].id;
            console.log(`Testing UPDATE on student id ${id}...`);

            // Simulate student.js query
            // `UPDATE students SET phone = ?, dob = ?, address = ? WHERE id = ?`
            const query = "UPDATE students SET phone = ?, dob = ?, address = ? WHERE id = ?";
            const params = ['123456', '2000-01-01', 'Test Address', id];

            db.query(query, params, (err3, res) => {
                if (err3) {
                    console.error("UPDATE FAILED:", err3.message);
                    console.error("SQL State:", err3.sqlState);
                } else {
                    console.log("Update SUCCESS:", res.message);
                }
                process.exit();
            });
        });
    });
}

debugProfile();

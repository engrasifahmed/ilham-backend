const db = require('./db');

async function fixSchema() {
    console.log("Checking DB Schema...");

    // Check Students Table
    db.query("SHOW COLUMNS FROM students", (err, cols) => {
        if (err) { console.error(err); process.exit(1); }

        const colNames = cols.map(c => c.Field);
        console.log("Student Columns:", colNames);

        const updates = [];

        if (!colNames.includes('dob')) {
            updates.push("ADD COLUMN dob DATE NULL");
            console.log(" -> Missing dob");
        }

        if (!colNames.includes('ielts_score')) {
            updates.push("ADD COLUMN ielts_score VARCHAR(50) NULL");
            console.log(" -> Missing ielts_score");
        }

        if (updates.length > 0) {
            const sql = `ALTER TABLE students ${updates.join(', ')}`;
            console.log("Running:", sql);
            db.query(sql, (uErr) => {
                if (uErr) console.error("Update failed:", uErr);
                else console.log("Schema updated successfully!");
                checkGuardians();
            });
        } else {
            console.log("Students table looks good.");
            checkGuardians();
        }
    });
}

function checkGuardians() {
    db.query("SHOW COLUMNS FROM guardians", (err, cols) => {
        if (err) {
            // Table might not exist?
            console.log("Guardians table error (maybe missing?):", err.message);
            // Create if missing
            const createSql = `
                CREATE TABLE IF NOT EXISTS guardians (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    guardian_name VARCHAR(255),
                    guardian_phone VARCHAR(50),
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                )`;
            db.query(createSql, (cErr) => {
                if (cErr) console.error("Create guardians failed:", cErr);
                else console.log("Guardians table verified/created.");
                process.exit();
            });
        } else {
            console.log("Guardians table exists.");
            process.exit();
        }
    });
}

fixSchema();

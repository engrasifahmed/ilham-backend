const db = require('./db');

async function fixGuardiansTable() {
    try {
        // Check current structure
        console.log("Checking current table structure...");
        const columns = await new Promise((resolve, reject) => {
            db.query('DESCRIBE guardians', (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        console.log("Current columns:", columns.map(c => c.Field).join(', '));

        // Check if 'id' column exists
        const hasId = columns.some(c => c.Field === 'id');

        if (hasId) {
            console.log("✅ Table already has 'id' column!");
            process.exit(0);
            return;
        }

        console.log("Adding 'id' column...");

        // Get all existing data
        const existingData = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM guardians', (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        console.log(`Found ${existingData.length} existing records`);

        // Rename old table
        await new Promise((resolve, reject) => {
            db.query('RENAME TABLE guardians TO guardians_old', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Create new table with id column
        await new Promise((resolve, reject) => {
            db.query(`
                CREATE TABLE guardians (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    guardian_name VARCHAR(255),
                    relationship_to_student VARCHAR(100),
                    guardian_phone VARCHAR(20),
                    guardian_email VARCHAR(255),
                    guardian_address TEXT,
                    is_emergency_contact TINYINT(1) DEFAULT 1,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Copy data back
        if (existingData.length > 0) {
            console.log("Copying data to new table...");
            for (const row of existingData) {
                await new Promise((resolve, reject) => {
                    db.query(`
                        INSERT INTO guardians 
                        (student_id, guardian_name, relationship_to_student, guardian_phone, guardian_email, guardian_address, is_emergency_contact)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        row.student_id,
                        row.guardian_name,
                        row.relationship_to_student,
                        row.guardian_phone,
                        row.guardian_email,
                        row.guardian_address,
                        row.is_emergency_contact || 1
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }

        // Drop old table
        await new Promise((resolve, reject) => {
            db.query('DROP TABLE guardians_old', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log("✅ Table fixed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

fixGuardiansTable();

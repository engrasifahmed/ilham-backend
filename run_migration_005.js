const db = require('./db');

async function migrateGuardians() {
    try {
        // Step 1: Get existing data
        console.log("📦 Backing up existing guardian data...");
        const existingData = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM guardians', (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        console.log(`Found ${existingData.length} guardian records`);

        // Step 2: Drop and recreate table
        console.log("🔨 Recreating guardians table...");
        await new Promise((resolve, reject) => {
            db.query('DROP TABLE IF EXISTS guardians', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

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

        // Step 3: Restore data
        if (existingData.length > 0) {
            console.log("📥 Restoring guardian data...");
            for (const guardian of existingData) {
                await new Promise((resolve, reject) => {
                    db.query(`
                        INSERT INTO guardians 
                        (student_id, guardian_name, relationship_to_student, guardian_phone, guardian_email, guardian_address, is_emergency_contact)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        guardian.student_id,
                        guardian.guardian_name,
                        guardian.relationship_to_student,
                        guardian.guardian_phone,
                        guardian.guardian_email,
                        guardian.guardian_address,
                        guardian.is_emergency_contact || 1
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }

        console.log("✅ Migration completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrateGuardians();

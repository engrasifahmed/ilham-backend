const db = require('./db');

async function migrate() {
    try {
        console.log("Checking site_content table...");

        const createTable = `
            CREATE TABLE IF NOT EXISTS site_content (
                section_key VARCHAR(50) PRIMARY KEY,
                content_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        await db.promise().query(createTable);
        console.log("site_content table ensured.");

        // Insert defaults if empty
        const [rows] = await db.promise().query("SELECT COUNT(*) as count FROM site_content");
        if (rows[0].count === 0) {
            console.log("Seeding default content...");
            const defaults = [
                ['hero_title', 'Empowering Students to Achieve Their Academic Dreams Worldwide'],
                ['hero_subtitle', 'Expert guidance for study abroad, admissions, scholarships, and test preparation.'],
                ['contact_email', 'info@ilhamexample.com'],
                ['contact_phone', '+880 1234 567890'],
                ['contact_address', 'Dhaka, Bangladesh']
            ];

            for (const [key, val] of defaults) {
                await db.promise().query("INSERT IGNORE INTO site_content (section_key, content_value) VALUES (?, ?)", [key, val]);
            }
            console.log("Defaults seeded.");
        }

    } catch (err) {
        console.error("Migration Error:", err);
    }
    process.exit();
}

migrate();

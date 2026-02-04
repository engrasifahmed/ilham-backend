const db = require('./db');

async function checkTables() {
    try {
        const [rows] = await db.promise().query("SHOW TABLES");
        console.log("Tables:", rows.map(r => Object.values(r)[0]));

        // Check site_content specifically
        try {
            const [desc] = await db.promise().query("DESCRIBE site_content");
            console.log("site_content schema:", desc);
        } catch (e) {
            console.log("site_content table missing!");
        }

    } catch (err) {
        console.error("DB Connection Error:", err);
    }
    process.exit();
}

checkTables();

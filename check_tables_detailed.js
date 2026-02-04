const db = require('./db');

async function checkDetails() {
    try {
        console.log("--- Universities Table ---");
        try {
            const [uDesc] = await db.promise().query("DESCRIBE universities");
            console.log(uDesc.map(c => c.Field));
            const [uRows] = await db.promise().query("SELECT * FROM universities LIMIT 1");
            console.log("Row count:", uRows.length);
        } catch (e) {
            console.error("Universities Error:", e.message);
        }

        console.log("\n--- IELTS Courses Table ---");
        try {
            const [icDesc] = await db.promise().query("DESCRIBE ielts_courses");
            console.log(icDesc.map(c => c.Field));
        } catch (e) {
            console.error("IELTS Courses Error:", e.message);
        }

        console.log("\n--- IELTS Materials Table ---");
        try {
            const [imDesc] = await db.promise().query("DESCRIBE ielts_materials");
            console.log(imDesc.map(c => c.Field));
        } catch (e) {
            console.error("IELTS Materials Error:", e.message);
        }

    } catch (err) {
        console.error("Connection Error:", err);
    }
    process.exit();
}

checkDetails();

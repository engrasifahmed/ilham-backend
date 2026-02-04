const db = require('./db');
async function checkMockTables() {
    try {
        const [rows] = await db.promise().query("SHOW TABLES LIKE '%mock%'");
        console.log("Found Tables:", rows.map(r => Object.values(r)[0]));

        for (const row of rows) {
            const tableName = Object.values(row)[0];
            const [cols] = await db.promise().query(`DESCRIBE ${tableName}`);
            console.log(`\nTABLE: ${tableName}`);
            cols.forEach(c => console.log(` - ${c.Field} (${c.Type})`));
        }
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
checkMockTables();

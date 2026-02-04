const db = require('./db');
async function checkSchema() {
    try {
        const [rows] = await db.promise().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ilham' AND TABLE_NAME LIKE '%mock%'
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
checkSchema();

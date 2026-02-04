const db = require('./db');
const sql = "ALTER TABLE applications ADD COLUMN program VARCHAR(255) NULL, ADD COLUMN notes TEXT NULL";
db.query(sql, (err) => {
    if (err) {
        // Ignore duplicate column error usually code 'ER_DUP_FIELDNAME'
        console.log("Result:", err.code || err.message);
    } else {
        console.log("Columns added successfully");
    }
    process.exit();
});

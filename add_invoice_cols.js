const db = require('./db');
const sql = "ALTER TABLE invoices ADD COLUMN due_date DATE NULL, ADD COLUMN description VARCHAR(255) NULL";
db.query(sql, (err) => {
    if (err) console.log("Error:", err.code);
    else console.log("Columns added to invoices");
    process.exit();
});

const db = require('./db');

db.query("SHOW COLUMNS FROM applications", (err, cols) => {
    if (err) { console.error("Error:", err); return; }
    console.log("Applications Columns:", cols.map(c => c.Field));
    process.exit();
});

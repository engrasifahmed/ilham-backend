const db = require('./db');

db.query("SHOW COLUMNS FROM notifications", (err, cols) => {
    if (err) { console.error("Error:", err); return; }
    console.log("Notifications Columns:", cols.map(c => c.Field));
    process.exit();
});

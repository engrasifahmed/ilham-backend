const db = require('./db');
db.query("SHOW COLUMNS FROM invoices LIKE 'student_id'", (err, res) => {
    if (err) console.log(err);
    else console.log("Found student_id:", res.length > 0);
    process.exit();
});

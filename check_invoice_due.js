const db = require('./db');
db.query("SHOW COLUMNS FROM invoices LIKE 'due_date'", (err, res) => {
    if (err) console.log(err);
    else console.log("Found due_date:", res.length > 0);
    process.exit();
});

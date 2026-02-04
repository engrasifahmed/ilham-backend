const db = require('./db');
db.query("SHOW COLUMNS FROM users", (err, res) => {
    if (err) console.error('Error:', err);
    else console.log('Columns:', res.map(r => r.Field));
    process.exit();
});

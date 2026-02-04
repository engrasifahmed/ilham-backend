const db = require('./db');
db.query("SHOW COLUMNS FROM applications", (err, res) => {
    if (err) console.error(err);
    else console.log(res.map(c => c.Field));
    process.exit();
});

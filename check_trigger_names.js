const db = require('./db');
db.query("SHOW TRIGGERS LIKE 'applications'", (err, res) => {
    if (res) {
        console.log(res.map(t => t.Trigger));
    }
    process.exit();
});

const db = require('./db');
db.query("SHOW TRIGGERS LIKE 'applications'", (err, res) => {
    if (res) {
        const t = res.find(tr => tr.Trigger.includes('status_change'));
        if (t) console.log(JSON.stringify(t.Statement));
    }
    process.exit();
});

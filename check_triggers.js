const db = require('./db');
db.query("SHOW TRIGGERS LIKE 'applications'", (err, res) => {
    if (err) console.error(err);
    else {
        res.forEach(t => {
            console.log("Trigger:", t.Trigger);
            console.log("Event:", t.Event);
            console.log("Timing:", t.Timing);
            console.log("Statement:", t.Statement);
            console.log("-------------------");
        });
    }
    process.exit();
});

const db = require('./db');

db.query("SHOW COLUMNS FROM application_history", (err, cols) => {
    if (err) console.log("History Error:", err.message);
    else console.log("History Columns:", cols.map(c => c.Field));

    db.query("SHOW COLUMNS FROM notifications", (err2, cols2) => {
        if (err2) console.log("Notif Error:", err2.message);
        else console.log("Notif Columns:", cols2.map(c => c.Field));
        process.exit();
    });
});

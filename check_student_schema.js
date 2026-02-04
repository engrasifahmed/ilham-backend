const db = require('./db');
db.query("SHOW COLUMNS FROM students", (err, res) => {
    if (err) console.log(err);
    else console.log("Student Columns:", res.map(c => c.Field));

    db.query("SHOW COLUMNS FROM guardians", (err2, res2) => {
        if (err2) console.log("Guardians table missing or error");
        else console.log("Guardians Columns:", res2.map(c => c.Field));
        process.exit();
    });
});

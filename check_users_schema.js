const db = require('./db');
db.query("DESCRIBE users", (err, res) => {
    if (err) console.error(err);
    else console.log('Users:', res.map(c => c.Field));

    db.query("DESCRIBE students", (err2, res2) => {
        if (err2) console.error(err2);
        else console.log('Students:', res2.map(c => c.Field));
        process.exit();
    });
});

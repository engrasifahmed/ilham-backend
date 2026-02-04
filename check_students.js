const db = require('./db');
db.query("DESCRIBE students", (err, res) => {
    if (err) console.error(err);
    else console.log(res.map(c => c.Field));
    process.exit();
});

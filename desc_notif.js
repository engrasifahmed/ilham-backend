const db = require('./db');

db.query("DESCRIBE notifications", (err, res) => {
    if (err) console.log(err);
    else console.table(res);
    process.exit();
});

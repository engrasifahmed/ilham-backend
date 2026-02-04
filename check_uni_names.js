const db = require('./db');

db.query("SELECT id, name FROM universities WHERE id IN (1, 3)", (err, res) => {
    if (err) console.log(err);
    else console.table(res);
    process.exit();
});

const db = require('./db');

db.query("SELECT id, name FROM universities WHERE id IN (1, 3)", (err, res) => {
    if (err) console.log(err);
    else console.log(JSON.stringify(res, null, 2));
    process.exit();
});

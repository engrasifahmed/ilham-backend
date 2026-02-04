const db = require('./db');

db.query('DESCRIBE universities', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows.map(r => r.Field)));
    }
    process.exit();
});

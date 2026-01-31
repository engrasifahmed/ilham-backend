// Delete invoice reminders manually
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham'
});

console.log('🗑️  Deleting invoice payment reminders...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    db.query(
        "DELETE FROM reminders WHERE note LIKE '%invoice%' OR note LIKE '%Invoice%'",
        (err, result) => {
            if (err) {
                console.error('❌ Delete failed:', err.message);
                db.end();
                process.exit(1);
            }

            console.log(`✅ Deleted ${result.affectedRows} invoice reminders\n`);
            db.end();
            process.exit(0);
        }
    );
});

// Update universities with IELTS requirements
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham',
    multipleStatements: true
});

console.log('🎓 Updating university requirements...\n');

const sql = fs.readFileSync(path.join(__dirname, 'update-university-requirements.sql'), 'utf8');

db.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Update failed:', err.message);
            db.end();
            process.exit(1);
        }

        console.log('✅ Universities updated with IELTS requirements!\n');
        db.end();
        process.exit(0);
    });
});

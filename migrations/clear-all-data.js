// Clear all database data and reset IDs
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

console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!\n');
console.log('🗑️  Clearing database...\n');

const sql = fs.readFileSync(path.join(__dirname, 'clear-database.sql'), 'utf8');

db.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Clear failed:', err.message);
            db.end();
            process.exit(1);
        }

        console.log('✅ Database cleared successfully!');
        console.log('✅ All auto-increment IDs reset to 1');
        console.log('\n📝 You can now add your own data through the admin panel.\n');
        db.end();
        process.exit(0);
    });
});

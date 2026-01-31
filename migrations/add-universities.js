// Add sample universities to database
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham',
    multipleStatements: true
});

const fs = require('fs');
const path = require('path');

console.log('🎓 Adding sample universities...\n');

const sql = fs.readFileSync(path.join(__dirname, 'add-sample-universities.sql'), 'utf8');

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    console.log('✅ Connected to database');

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Failed:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log('✅ Sample universities added successfully!\n');
        connection.end();
        process.exit(0);
    });
});

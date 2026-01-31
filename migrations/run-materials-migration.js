// Run materials tables migration
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

console.log('📚 Creating IELTS materials tables...\n');

const sql = fs.readFileSync(path.join(__dirname, '002_create_materials_tables.sql'), 'utf8');

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    console.log('✅ Connected to database');

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Migration failed:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log('✅ IELTS materials tables created successfully!\n');
        connection.end();
        process.exit(0);
    });
});

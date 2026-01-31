// Simple Database Migration Runner
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

console.log('🔧 Running database migration...\n');

const sql = fs.readFileSync(path.join(__dirname, '001_fix_schema_simple.sql'), 'utf8');

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    console.log('✅ Connected to database: ilham');

    connection.query(sql, (err, results) => {
        if (err) {
            // Check if error is just "column already exists" which we can ignore
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columns already exist - migration not needed');
                connection.end();
                process.exit(0);
            } else {
                console.error('❌ Migration failed:', err.message);
                connection.end();
                process.exit(1);
            }
        }

        console.log('✅ Migration completed successfully!');
        console.log('\n📝 Changes applied:');
        console.log('  - Added email column to students table');
        console.log('  - Added password column to students table');
        console.log('  - Added status column to payments table');
        console.log('  - Added notes column to payments table\n');

        connection.end();
        console.log('✅ Database connection closed\n');
        process.exit(0);
    });
});

// Database Migration Runner
// Run this file to execute SQL migrations

const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham',
    multipleStatements: true
});

const fs = require('fs');
const path = require('path');

console.log('🔧 Running database migrations...\n');

// Read migration file
const migrationPath = path.join(__dirname, '001_fix_schema.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }

    console.log('✅ Connected to database');

    // Execute migration
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Migration failed:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
        console.log('\nChanges applied:');
        console.log('- Added email and password columns to students table');
        console.log('- Added status and notes columns to payments table');
        console.log('- Added foreign key constraints for data integrity');
        console.log('- Added created_at timestamps to all tables');
        console.log('- Created indexes for better performance\n');

        connection.end();
        console.log('✅ Database connection closed');
        process.exit(0);
    });
});

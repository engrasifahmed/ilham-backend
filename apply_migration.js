const fs = require('fs');
const db = require('./db');

const migrationFile = './migrations/006_add_ielts_requirement.sql';
const sql = fs.readFileSync(migrationFile, 'utf8');

// Simple split by semicolon to handle multiple statements (basic approach)
const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

function runQuery(index) {
    if (index >= queries.length) {
        console.log('Migration completed successfully.');
        process.exit(0);
    }

    db.query(queries[index], (err, result) => {
        if (err) {
            // Ignore "Duplicate column name" error if we re-run
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`Skipping duplicate column error for query: ${queries[index].substring(0, 50)}...`);
            } else {
                console.error('Migration failed:', err);
                process.exit(1);
            }
        } else {
            console.log(`Executed: ${queries[index].substring(0, 50)}...`);
        }
        runQuery(index + 1);
    });
}

runQuery(0);

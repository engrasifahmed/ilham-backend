const db = require('./db');
const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'migrations', '003_add_payment_fields.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

// Split by semi-colon to run multiple statements
const statements = sql.split(';').filter(s => s.trim());

async function runhelper() {
    for (const statement of statements) {
        if (!statement.trim()) continue;
        console.log(`Running: ${statement}`);
        await new Promise((resolve, reject) => {
            db.query(statement, (err) => {
                if (err) {
                    // Ignore duplicate column error usually code 1060
                    if (err.errno === 1060) {
                        console.log("Column already exists, skipping.");
                        resolve();
                    } else {
                        console.error("Error executing statement:", err);
                        reject(err);
                    }
                } else {
                    console.log("Success.");
                    resolve();
                }
            });
        });
    }
    console.log("Migration finished.");
    process.exit(0);
}

runhelper().catch(() => process.exit(1));

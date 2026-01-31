const db = require('./db');
const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'migrations', '004_add_otp_fields.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

const statements = sql.split(';').filter(s => s.trim());

async function runhelper() {
    for (const statement of statements) {
        if (!statement.trim()) continue;
        console.log(`Running: ${statement}`);
        await new Promise((resolve, reject) => {
            db.query(statement, (err) => {
                if (err) {
                    if (err.errno === 1060) {
                        console.log("Column already exists.");
                        resolve();
                    } else {
                        console.error("Error:", err);
                        reject(err);
                    }
                } else {
                    console.log("Success.");
                    resolve();
                }
            });
        });
    }
    process.exit(0);
}

runhelper().catch(() => process.exit(1));

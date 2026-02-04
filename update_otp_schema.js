const db = require('./db');

const queries = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at DATETIME",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified TINYINT DEFAULT 0"
];

function run(index) {
    if (index >= queries.length) {
        console.log("Schema updated");
        process.exit();
    }
    db.query(queries[index], (err) => {
        if (err && !err.message.includes("Duplicate")) console.error(err);
        run(index + 1);
    });
}
run(0);

const db = require('./db');

// Add new columns to ielts_courses
const query = `
    ALTER TABLE ielts_courses 
    ADD COLUMN description TEXT,
    ADD COLUMN duration VARCHAR(50) DEFAULT '8 weeks', 
    ADD COLUMN schedule VARCHAR(100) DEFAULT 'Flexible', 
    ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;
`;

console.log("Running migration...");
db.query(query, (err, res) => {
    if (err) {
        // Ignore duplicate column errors (code 1060)
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist. Skipping.");
        } else {
            console.error("Migration failed:", err);
        }
    } else {
        console.log("Migration success!");
    }
    process.exit();
});

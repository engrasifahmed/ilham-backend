const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham',
    multipleStatements: true
});

console.log('🔧 Fixing students table...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    const sql = `
    ALTER TABLE students 
    ADD COLUMN email VARCHAR(100) AFTER full_name,
    ADD COLUMN password VARCHAR(255) AFTER email,
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER photo_url;
    
    ALTER TABLE students ADD UNIQUE KEY unique_student_email (email);
  `;

    db.query(sql, (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ Columns already exist - table is already fixed!');
            } else {
                console.error('❌ Error:', err.message);
            }
            db.end();
            process.exit(err.code === 'ER_DUP_FIELDNAME' ? 0 : 1);
        }

        console.log('✅ Students table updated successfully!');
        console.log('✅ Added columns: email, password, created_at');
        console.log('✅ Student creation should work now!\n');
        db.end();
        process.exit(0);
    });
});

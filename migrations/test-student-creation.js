const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham'
});

console.log('🔍 Checking students table structure...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    db.query('DESCRIBE students', (err, columns) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.end();
            process.exit(1);
        }

        console.log('📋 Students table columns:');
        columns.forEach(col => {
            console.log(`   - ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\n🧪 Testing student creation query...\n');

        // Test the exact query used in the code
        const testQuery = `INSERT INTO students (full_name, email, phone, password, created_at)
                       VALUES (?, ?, ?, ?, NOW())`;

        console.log('Query:', testQuery);
        console.log('Params: ["Test Name", "test@example.com", "1234567890", "hashedpass123"]');

        db.query(
            testQuery,
            ['Test Name', 'test@example.com', '1234567890', 'hashedpass123'],
            (err, result) => {
                if (err) {
                    console.log('\n❌ Query failed!');
                    console.log('Error code:', err.code);
                    console.log('Error message:', err.message);
                    console.log('SQL:', err.sql);
                } else {
                    console.log('\n✅ Query succeeded!');
                    console.log('Inserted ID:', result.insertId);

                    // Clean up test data
                    db.query('DELETE FROM students WHERE id = ?', [result.insertId], () => {
                        console.log('✅ Test data cleaned up');
                    });
                }

                db.end();
                process.exit(err ? 1 : 0);
            }
        );
    });
});

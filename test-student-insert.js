const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham'
});

console.log('🧪 Testing student creation query...\n');

db.connect(async (err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    const testData = {
        full_name: 'Test Student',
        email: 'testuser@example.com',
        password: 'password123',
        phone: '1234567890',
        passport_no: 'TEST123',
        nationality: 'Bangladesh'
    };

    console.log('Test data:', testData);
    console.log('\nHashing password...');

    const hashedPassword = await bcrypt.hash(testData.password, 10);
    console.log('✅ Password hashed');

    const query = `INSERT INTO students (user_id, full_name, email, password, phone, passport_no, nationality, created_at)
                 VALUES (NULL, ?, ?, ?, ?, ?, ?, NOW())`;

    const values = [
        testData.full_name,
        testData.email,
        hashedPassword,
        testData.phone,
        testData.passport_no,
        testData.nationality
    ];

    console.log('\nExecuting query...');
    console.log('Query:', query);
    console.log('Values:', values);

    db.query(query, values, (err, result) => {
        if (err) {
            console.log('\n❌ QUERY FAILED!');
            console.log('Error code:', err.code);
            console.log('Error message:', err.message);
            console.log('SQL State:', err.sqlState);
            console.log('SQL:', err.sql);
        } else {
            console.log('\n✅ QUERY SUCCEEDED!');
            console.log('Inserted ID:', result.insertId);

            // Clean up
            db.query('DELETE FROM students WHERE id = ?', [result.insertId], () => {
                console.log('✅ Test data cleaned up');
            });
        }

        db.end();
        process.exit(err ? 1 : 0);
    });
});

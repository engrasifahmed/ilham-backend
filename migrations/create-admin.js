// Create admin account with correct password hash
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ilham'
});

const email = 'admin@ilham.edu';
const password = 'ilham123';

console.log('🔐 Creating admin account...\n');

db.connect(async (err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }

    try {
        // Generate proper password hash
        const passwordHash = await bcrypt.hash(password, 10);

        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Hash:', passwordHash);
        console.log('');

        // Insert admin user
        db.query(
            'INSERT INTO users (email, password_hash, is_verified, role) VALUES (?, ?, 1, "ADMIN")',
            [email, passwordHash],
            (err, result) => {
                if (err) {
                    console.error('❌ Failed to create admin:', err.message);
                    db.end();
                    process.exit(1);
                }

                console.log('✅ Admin account created successfully!');
                console.log('✅ User ID:', result.insertId);
                console.log('\n📧 Login credentials:');
                console.log('   Email:', email);
                console.log('   Password:', password);
                console.log('\n🔗 Login at: http://localhost:4000/admin/login.html\n');

                db.end();
                process.exit(0);
            }
        );
    } catch (error) {
        console.error('❌ Error:', error.message);
        db.end();
        process.exit(1);
    }
});

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabaseViews() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'ilham',
        multipleStatements: true
    });

    console.log('🔄 Creating database views...\n');

    try {
        // View 1: Unpaid Invoices
        console.log('📊 Creating v_unpaid_invoices...');
        await connection.query(`
      CREATE OR REPLACE VIEW v_unpaid_invoices AS
      SELECT 
        i.id AS invoice_id,
        i.amount,
        i.created_at AS invoice_date,
        a.id AS application_id,
        s.id AS student_id,
        s.full_name AS student_name,
        u.name AS university_name,
        u.country AS university_country
      FROM invoices i
      JOIN applications a ON i.application_id = a.id
      JOIN students s ON a.student_id = s.id
      JOIN universities u ON a.university_id = u.id
      WHERE i.status = 'Unpaid'
    `);
        console.log('✅ v_unpaid_invoices created\n');

        // View 2: Unread Notifications
        console.log('📊 Creating v_unread_notifications...');
        await connection.query(`
      CREATE OR REPLACE VIEW v_unread_notifications AS
      SELECT 
        s.id AS student_id,
        s.full_name AS student_name,
        COUNT(n.id) AS unread_count
      FROM students s
      LEFT JOIN notifications n ON s.id = n.student_id AND n.is_read = 0
      GROUP BY s.id, s.full_name
    `);
        console.log('✅ v_unread_notifications created\n');

        // View 3: Student Applications Summary
        console.log('📊 Creating v_student_applications...');
        await connection.query(`
      CREATE OR REPLACE VIEW v_student_applications AS
      SELECT 
        a.id AS application_id,
        a.student_id,
        s.full_name AS student_name,
        s.email AS student_email,
        a.university_id,
        u.name AS university_name,
        u.country,
        a.status,
        a.created_at AS applied_at,
        a.updated_at,
        a.counselor_remark
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN universities u ON a.university_id = u.id
    `);
        console.log('✅ v_student_applications created\n');

        console.log('🎉 All database views created successfully!');

    } catch (error) {
        console.error('❌ Error creating views:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run if called directly
if (require.main === module) {
    createDatabaseViews()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = createDatabaseViews;

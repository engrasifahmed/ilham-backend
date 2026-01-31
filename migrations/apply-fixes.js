const mysql = require('mysql2/promise');

async function applyDatabaseFixes() {
    let connection;

    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'ilham'
        });

        console.log('✓ Connected to database');
        console.log('Starting database migration...\n');

        // ========================================================================
        // SECTION 1: Remove Redundant Password Column
        // ========================================================================
        console.log('📝 Section 1: Removing redundant password column...');
        try {
            await connection.query(`ALTER TABLE students DROP COLUMN password`);
            console.log('✓ Removed password column from students table');
        } catch (err) {
            if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠ Password column already removed');
            } else {
                console.error('Error removing password column:', err.message);
            }
        }

        // ========================================================================
        // SECTION 2: Add Missing Triggers
        // ========================================================================
        console.log('\n📝 Section 2: Adding missing triggers...');

        try {
            await connection.query(`DROP TRIGGER IF EXISTS after_application_rejected`);
            console.log('✓ Dropped old after_application_rejected trigger if exists');
        } catch (err) {
            console.log('Note:', err.message);
        }

        try {
            await connection.query(`
        CREATE TRIGGER after_application_rejected 
        AFTER UPDATE ON applications 
        FOR EACH ROW 
        BEGIN
          DECLARE v_student_id INT;
          DECLARE v_university_name VARCHAR(150);

          IF OLD.status <> 'Rejected' AND NEW.status = 'Rejected' THEN
            SELECT student_id INTO v_student_id FROM applications WHERE id = NEW.id;
            SELECT name INTO v_university_name FROM universities WHERE id = NEW.university_id;

            INSERT INTO notifications (student_id, message, is_read, created_at)
            VALUES (
              v_student_id,
              CONCAT('Your application to ', v_university_name, ' has been rejected. You may apply again.'),
              0,
              NOW()
            );
          END IF;
        END
      `);
            console.log('✓ Created after_application_rejected trigger');
        } catch (err) {
            console.error('Error creating rejection trigger:', err.message);
        }

        // ========================================================================
        // SECTION 3: Add Performance Indexes
        // ========================================================================
        console.log('\n📝 Section 3: Adding performance indexes...');

        const indexes = [
            { table: 'applications', name: 'idx_applications_status', column: 'status' },
            { table: 'notifications', name: 'idx_notifications_is_read', column: 'is_read' },
            { table: 'invoices', name: 'idx_invoices_status', column: 'status' },
            { table: 'payments', name: 'idx_payments_payment_date', column: 'payment_date' },
            { table: 'applications', name: 'idx_applications_created_at', column: 'created_at' }
        ];

        for (const idx of indexes) {
            try {
                await connection.query(`CREATE INDEX ${idx.name} ON ${idx.table} (${idx.column})`);
                console.log(`✓ Created index ${idx.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`⚠ Index ${idx.name} already exists`);
                } else {
                    console.error(`Error creating index ${idx.name}:`, err.message);
                }
            }
        }

        // Composite index
        try {
            await connection.query(`CREATE INDEX idx_notifications_student_read ON notifications (student_id, is_read)`);
            console.log('✓ Created composite index idx_notifications_student_read');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠ Composite index already exists');
            } else {
                console.error('Error creating composite index:', err.message);
            }
        }

        // ========================================================================
        // SECTION 4: Add Audit Fields (updated_at)
        // ========================================================================
        console.log('\n📝 Section 4: Adding audit fields...');

        const tables = ['applications', 'students', 'universities', 'invoices', 'ielts_courses', 'ielts_materials'];

        for (const table of tables) {
            try {
                await connection.query(`
          ALTER TABLE ${table} 
          ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
                console.log(`✓ Added updated_at to ${table}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⚠ updated_at already exists in ${table}`);
                } else {
                    console.error(`Error adding updated_at to ${table}:`, err.message);
                }
            }
        }

        // ========================================================================
        // SECTION 5: Add Validation Constraints
        // ========================================================================
        console.log('\n📝 Section 5: Adding validation constraints...');

        // IELTS score constraints - add one at a time
        const scoreConstraints = [
            { name: 'chk_listening_score', check: 'listening >= 0 AND listening <= 9 AND MOD(listening * 2, 1) = 0' },
            { name: 'chk_reading_score', check: 'reading >= 0 AND reading <= 9 AND MOD(reading * 2, 1) = 0' },
            { name: 'chk_writing_score', check: 'writing >= 0 AND writing <= 9 AND MOD(writing * 2, 1) = 0' },
            { name: 'chk_speaking_score', check: 'speaking >= 0 AND speaking <= 9 AND MOD(speaking * 2, 1) = 0' },
            { name: 'chk_overall_score', check: 'overall >= 0 AND overall <= 9 AND MOD(overall * 2, 1) = 0' }
        ];

        for (const constraint of scoreConstraints) {
            try {
                await connection.query(`ALTER TABLE ielts_results ADD CONSTRAINT ${constraint.name} CHECK (${constraint.check})`);
                console.log(`✓ Added ${constraint.name} constraint`);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
                    console.log(`⚠ ${constraint.name} already exists`);
                } else {
                    console.error(`Error adding ${constraint.name}:`, err.message);
                }
            }
        }

        // Invoice amount constraint
        try {
            await connection.query(`ALTER TABLE invoices ADD CONSTRAINT chk_invoice_amount CHECK (amount > 0)`);
            console.log('✓ Added invoice amount validation');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
                console.log('⚠ Invoice amount constraint already exists');
            } else {
                console.error('Error adding invoice constraint:', err.message);
            }
        }

        // Payment amount constraint
        try {
            await connection.query(`ALTER TABLE payments ADD CONSTRAINT chk_payment_amount CHECK (amount > 0)`);
            console.log('✓ Added payment amount validation');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
                console.log('⚠ Payment amount constraint already exists');
            } else {
                console.error('Error adding payment constraint:', err.message);
            }
        }

        // ========================================================================
        // SECTION 6: Create New Tables
        // ========================================================================
        console.log('\n📝 Section 6: Creating new tables...');

        // Student Documents table
        try {
            await connection.query(`
        CREATE TABLE IF NOT EXISTS student_documents (
          id INT(11) NOT NULL AUTO_INCREMENT,
          student_id INT(11) NOT NULL,
          document_type ENUM('Transcript', 'Certificate', 'Passport', 'Photo', 'Recommendation Letter', 'Other') NOT NULL,
          document_name VARCHAR(255) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          verified TINYINT(1) DEFAULT 0,
          verified_by INT(11) DEFAULT NULL,
          verified_at TIMESTAMP NULL DEFAULT NULL,
          PRIMARY KEY (id),
          KEY fk_student_documents_student (student_id),
          KEY fk_student_documents_verified_by (verified_by),
          CONSTRAINT fk_student_documents_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_student_documents_verified_by FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
            console.log('✓ Created student_documents table');
        } catch (err) {
            console.error('Error creating student_documents table:', err.message);
        }

        // Application History table
        try {
            await connection.query(`
        CREATE TABLE IF NOT EXISTS application_history (
          id INT(11) NOT NULL AUTO_INCREMENT,
          application_id INT(11) NOT NULL,
          old_status ENUM('Applied','Approved','Rejected') DEFAULT NULL,
          new_status ENUM('Applied','Approved','Rejected') NOT NULL,
          changed_by INT(11) DEFAULT NULL,
          remark TEXT DEFAULT NULL,
          changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY fk_app_history_application (application_id),
          KEY fk_app_history_changed_by (changed_by),
          CONSTRAINT fk_app_history_application FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_app_history_changed_by FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
            console.log('✓ Created application_history table');
        } catch (err) {
            console.error('Error creating application_history table:', err.message);
        }

        // Counselor Assignments table
        try {
            await connection.query(`
        CREATE TABLE IF NOT EXISTS counselor_assignments (
          id INT(11) NOT NULL AUTO_INCREMENT,
          student_id INT(11) NOT NULL,
          counselor_id INT(11) NOT NULL,
          assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_active TINYINT(1) DEFAULT 1,
          PRIMARY KEY (id),
          KEY fk_counselor_assign_student (student_id),
          KEY fk_counselor_assign_counselor (counselor_id),
          CONSTRAINT fk_counselor_assign_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_counselor_assign_counselor FOREIGN KEY (counselor_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
            console.log('✓ Created counselor_assignments table');
        } catch (err) {
            console.error('Error creating counselor_assignments table:', err.message);
        }

        // ========================================================================
        // SECTION 7: Add Additional Triggers
        // ========================================================================
        console.log('\n📝 Section 7: Adding additional triggers...');

        // Application status change history trigger
        try {
            await connection.query(`DROP TRIGGER IF EXISTS after_application_status_change`);
            await connection.query(`
        CREATE TRIGGER after_application_status_change 
        AFTER UPDATE ON applications 
        FOR EACH ROW 
        BEGIN
          IF OLD.status <> NEW.status THEN
            INSERT INTO application_history (application_id, old_status, new_status, remark, changed_at)
            VALUES (NEW.id, OLD.status, NEW.status, NEW.counselor_remark, NOW());
          END IF;
        END
      `);
            console.log('✓ Created after_application_status_change trigger');
        } catch (err) {
            console.error('Error creating status change trigger:', err.message);
        }

        // Payment updates invoice status trigger
        try {
            await connection.query(`DROP TRIGGER IF EXISTS after_payment_update_invoice`);
            await connection.query(`
        CREATE TRIGGER after_payment_update_invoice 
        AFTER INSERT ON payments 
        FOR EACH ROW 
        BEGIN
          DECLARE v_total_paid DECIMAL(10,2);
          DECLARE v_invoice_amount DECIMAL(10,2);

          SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
          FROM payments WHERE invoice_id = NEW.invoice_id;

          SELECT amount INTO v_invoice_amount
          FROM invoices WHERE id = NEW.invoice_id;

          IF v_total_paid >= v_invoice_amount THEN
            UPDATE invoices SET status = 'Paid' WHERE id = NEW.invoice_id;
          END IF;
        END
      `);
            console.log('✓ Created after_payment_update_invoice trigger');
        } catch (err) {
            console.error('Error creating payment trigger:', err.message);
        }

        // ========================================================================
        // SECTION 8: Create Views
        // ========================================================================
        console.log('\n📝 Section 8: Creating database views...');

        try {
            await connection.query(`DROP VIEW IF EXISTS v_student_applications`);
            await connection.query(`
        CREATE VIEW v_student_applications AS
        SELECT 
          s.id AS student_id,
          s.full_name,
          s.email,
          a.id AS application_id,
          u.name AS university_name,
          u.country,
          a.status,
          a.created_at AS applied_at,
          i.amount AS invoice_amount,
          i.status AS invoice_status,
          COALESCE(SUM(p.amount), 0) AS total_paid
        FROM students s
        LEFT JOIN applications a ON s.id = a.student_id
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN invoices i ON a.id = i.application_id
        LEFT JOIN payments p ON i.id = p.invoice_id
        GROUP BY s.id, s.full_name, s.email, a.id, u.name, u.country, a.status, a.created_at, i.amount, i.status
      `);
            console.log('✓ Created v_student_applications view');
        } catch (err) {
            console.error('Error creating student applications view:', err.message);
        }

        try {
            await connection.query(`DROP VIEW IF EXISTS v_unread_notifications`);
            await connection.query(`
        CREATE VIEW v_unread_notifications AS
        SELECT 
          s.id AS student_id,
          s.full_name,
          s.email,
          COUNT(n.id) AS unread_count
        FROM students s
        LEFT JOIN notifications n ON s.id = n.student_id AND n.is_read = 0
        GROUP BY s.id, s.full_name, s.email
      `);
            console.log('✓ Created v_unread_notifications view');
        } catch (err) {
            console.error('Error creating unread notifications view:', err.message);
        }

        try {
            await connection.query(`DROP VIEW IF EXISTS v_unpaid_invoices`);
            await connection.query(`
        CREATE VIEW v_unpaid_invoices AS
        SELECT 
          i.id AS invoice_id,
          s.id AS student_id,
          s.full_name,
          s.email,
          u.name AS university_name,
          i.amount AS invoice_amount,
          COALESCE(SUM(p.amount), 0) AS total_paid,
          (i.amount - COALESCE(SUM(p.amount), 0)) AS balance_due,
          i.created_at AS invoice_date
        FROM invoices i
        JOIN applications a ON i.application_id = a.id
        JOIN students s ON a.student_id = s.id
        JOIN universities u ON a.university_id = u.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        WHERE i.status = 'Unpaid'
        GROUP BY i.id, s.id, s.full_name, s.email, u.name, i.amount, i.created_at
        HAVING balance_due > 0
      `);
            console.log('✓ Created v_unpaid_invoices view');
        } catch (err) {
            console.error('Error creating unpaid invoices view:', err.message);
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   - Removed redundant password column');
        console.log('   - Added 3 new triggers');
        console.log('   - Added 6 performance indexes');
        console.log('   - Added updated_at to 6 tables');
        console.log('   - Added validation constraints');
        console.log('   - Created 3 new tables');
        console.log('   - Created 3 database views');

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        if (error.sql) {
            console.error('SQL:', error.sql.substring(0, 200));
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
}

// Run the migration
applyDatabaseFixes().catch(console.error);

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCascadeRules() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'ilham'
    });

    console.log('🔄 Adding CASCADE rules to foreign keys...\n');

    try {
        // Fix ielts_enrollments - student_id
        console.log('📝 Fixing ielts_enrollments.student_id...');
        try {
            await connection.query(`
        ALTER TABLE ielts_enrollments 
        DROP FOREIGN KEY ielts_enrollments_ibfk_1
      `);
            await connection.query(`
        ALTER TABLE ielts_enrollments 
        ADD CONSTRAINT ielts_enrollments_ibfk_1 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
            console.log('✅ ielts_enrollments.student_id fixed\n');
        } catch (err) {
            console.log('⚠️  Already fixed or different constraint name:', err.message, '\n');
        }

        // Fix ielts_enrollments - course_id
        console.log('📝 Fixing ielts_enrollments.course_id...');
        try {
            await connection.query(`
        ALTER TABLE ielts_enrollments 
        DROP FOREIGN KEY ielts_enrollments_ibfk_2
      `);
            await connection.query(`
        ALTER TABLE ielts_enrollments 
        ADD CONSTRAINT ielts_enrollments_ibfk_2 
        FOREIGN KEY (course_id) REFERENCES ielts_courses(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
            console.log('✅ ielts_enrollments.course_id fixed\n');
        } catch (err) {
            console.log('⚠️  Already fixed or different constraint name:', err.message, '\n');
        }

        // Fix ielts_mock_tests
        console.log('📝 Fixing ielts_mock_tests.course_id...');
        try {
            await connection.query(`
        ALTER TABLE ielts_mock_tests 
        DROP FOREIGN KEY ielts_mock_tests_ibfk_1
      `);
            await connection.query(`
        ALTER TABLE ielts_mock_tests 
        ADD CONSTRAINT ielts_mock_tests_ibfk_1 
        FOREIGN KEY (course_id) REFERENCES ielts_courses(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
            console.log('✅ ielts_mock_tests.course_id fixed\n');
        } catch (err) {
            console.log('⚠️  Already fixed or different constraint name:', err.message, '\n');
        }

        // Fix ielts_results - mock_test_id
        console.log('📝 Fixing ielts_results.mock_test_id...');
        try {
            await connection.query(`
        ALTER TABLE ielts_results 
        DROP FOREIGN KEY ielts_results_ibfk_1
      `);
            await connection.query(`
        ALTER TABLE ielts_results 
        ADD CONSTRAINT ielts_results_ibfk_1 
        FOREIGN KEY (mock_test_id) REFERENCES ielts_mock_tests(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
            console.log('✅ ielts_results.mock_test_id fixed\n');
        } catch (err) {
            console.log('⚠️  Already fixed or different constraint name:', err.message, '\n');
        }

        // Fix ielts_results - student_id
        console.log('📝 Fixing ielts_results.student_id...');
        try {
            await connection.query(`
        ALTER TABLE ielts_results 
        DROP FOREIGN KEY ielts_results_ibfk_2
      `);
            await connection.query(`
        ALTER TABLE ielts_results 
        ADD CONSTRAINT ielts_results_ibfk_2 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
            console.log('✅ ielts_results.student_id fixed\n');
        } catch (err) {
            console.log('⚠️  Already fixed or different constraint name:', err.message, '\n');
        }

        // Remove duplicate FK constraint in students table
        console.log('📝 Removing duplicate FK constraint from students...');
        try {
            await connection.query(`
        ALTER TABLE students DROP FOREIGN KEY students_ibfk_1
      `);
            console.log('✅ Duplicate constraint removed\n');
        } catch (err) {
            console.log('⚠️  Already removed or different constraint name:', err.message, '\n');
        }

        console.log('🎉 CASCADE rules update complete!');

    } catch (error) {
        console.error('❌ Error adding CASCADE rules:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run if called directly
if (require.main === module) {
    addCascadeRules()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = addCascadeRules;

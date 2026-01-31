const mysql = require('mysql2/promise');
const fs = require('fs');

async function removeUniqueConstraint() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'ilham'
    });

    let output = '🔧 Removing unique constraint to allow student reapplication...\n\n';

    try {
        output += 'Step 1: Dropping foreign key constraints...\n';
        await connection.query('ALTER TABLE applications DROP FOREIGN KEY fk_applications_student');
        output += '✅ Dropped fk_applications_student\n';

        await connection.query('ALTER TABLE applications DROP FOREIGN KEY fk_applications_university');
        output += '✅ Dropped fk_applications_university\n\n';

        output += 'Step 2: Removing unique constraint...\n';
        await connection.query('ALTER TABLE applications DROP KEY uniq_student_university');
        output += '✅ Removed uniq_student_university\n\n';

        output += 'Step 3: Recreating foreign key constraints...\n';
        await connection.query(`
      ALTER TABLE applications 
      ADD CONSTRAINT fk_applications_student 
      FOREIGN KEY (student_id) REFERENCES students(id) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
        output += '✅ Recreated fk_applications_student\n';

        await connection.query(`
      ALTER TABLE applications 
      ADD CONSTRAINT fk_applications_university 
      FOREIGN KEY (university_id) REFERENCES universities(id) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
        output += '✅ Recreated fk_applications_university\n\n';

        output += '='.repeat(80) + '\n';
        output += '✅ SUCCESS! Students can now reapply to the same university after rejection.\n';
        output += '='.repeat(80) + '\n\n';

        // Show final structure
        const [finalCreate] = await connection.query('SHOW CREATE TABLE applications');
        output += 'Final table structure:\n';
        output += finalCreate[0]['Create Table'];
        output += '\n';

    } catch (error) {
        output += `\n❌ Error: ${error.message}\n`;
        output += `SQL State: ${error.sqlState}\n`;
        output += `Error Code: ${error.code}\n`;
    } finally {
        await connection.end();
    }

    fs.writeFileSync('constraint-removal-result.txt', output);
    console.log(output);
}

removeUniqueConstraint().catch(console.error);

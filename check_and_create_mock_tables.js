const db = require('./db');

async function setupMockTables() {
    console.log("Checking Mock Test Tables...");

    try {
        // 1. ielts_mock_tests
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS ielts_mock_tests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                test_name VARCHAR(255) NOT NULL,
                type ENUM('Academic', 'General') DEFAULT 'Academic',
                duration_minutes INT DEFAULT 60,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ ielts_mock_tests table ready.");

        // 2. ielts_mock_questions
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS ielts_mock_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                test_id INT NOT NULL,
                section ENUM('Listening', 'Reading', 'Writing', 'Speaking') NOT NULL,
                question_text TEXT NOT NULL,
                options_json JSON, -- For multiple choice: ["Option A", "Option B", ...]
                correct_answer TEXT,
                points INT DEFAULT 1,
                FOREIGN KEY (test_id) REFERENCES ielts_mock_tests(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ ielts_mock_questions table ready.");

        // 3. ielts_results
        // Check if table exists first to avoid error on modifying existing
        const [exists] = await db.promise().query("SHOW TABLES LIKE 'ielts_results'");

        if (exists.length === 0) {
            await db.promise().query(`
                CREATE TABLE ielts_results (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    mock_test_id INT,
                    overall DECIMAL(3,1),
                    listening DECIMAL(3,1),
                    reading DECIMAL(3,1),
                    writing DECIMAL(3,1),
                    speaking DECIMAL(3,1),
                    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                )
            `);
            console.log("✅ ielts_results table created.");
        } else {
            // If exists, ensure columns match. This is a simplified check.
            console.log("ℹ️ ielts_results table already exists. Assuming schema is compatible or manually managed.");
        }

        // 4. Seed some dummy data if empty
        const [tests] = await db.promise().query("SELECT * FROM ielts_mock_tests");
        if (tests.length === 0) {
            console.log("Seeding dummy test data...");
            const [res] = await db.promise().query(`
                INSERT INTO ielts_mock_tests (test_name, type, duration_minutes) 
                VALUES ('IELTS Academic Practice 1', 'Academic', 30)
            `);
            const testId = res.insertId;

            // Seed Questions
            const questions = [
                // Listening
                { section: 'Listening', text: 'What is the speaker discussing?', options: JSON.stringify(['Global Warming', 'Economics', 'History']), answer: 'Global Warming' },
                { section: 'Listening', text: 'How many people attended?', options: JSON.stringify(['50', '100', '150']), answer: '100' },
                // Reading
                { section: 'Reading', text: 'According to the text, what affects climate change?', options: JSON.stringify(['Cars', 'Trees', 'Both']), answer: 'Both' },
                // Writing
                { section: 'Writing', text: 'Write an essay on the importance of education.', options: null, answer: null },
            ];

            for (const q of questions) {
                await db.promise().query(`
                    INSERT INTO ielts_mock_questions (test_id, section, question_text, options_json, correct_answer)
                    VALUES (?, ?, ?, ?, ?)
                `, [testId, q.section, q.text, q.options, q.answer]);
            }
            console.log("✅ Dummy test data seeded.");
        }

    } catch (err) {
        console.error("❌ Error setting up tables:", err);
    }
    process.exit();
}

setupMockTables();

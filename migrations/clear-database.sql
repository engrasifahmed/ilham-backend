-- CLEAR ALL DATA AND RESET DATABASE
-- WARNING: This will delete ALL data from all tables!

USE ilham;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all data from tables
TRUNCATE TABLE payments;
TRUNCATE TABLE invoices;
TRUNCATE TABLE reminders;
TRUNCATE TABLE notifications;
TRUNCATE TABLE ielts_mock_results;
TRUNCATE TABLE ielts_mock_tests;
TRUNCATE TABLE ielts_enrollments;
TRUNCATE TABLE ielts_courses;
TRUNCATE TABLE applications;
TRUNCATE TABLE students;
TRUNCATE TABLE universities;
TRUNCATE TABLE ielts_materials;
TRUNCATE TABLE mock_test_questions;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters to 1
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE invoices AUTO_INCREMENT = 1;
ALTER TABLE reminders AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE ielts_mock_results AUTO_INCREMENT = 1;
ALTER TABLE ielts_mock_tests AUTO_INCREMENT = 1;
ALTER TABLE ielts_enrollments AUTO_INCREMENT = 1;
ALTER TABLE ielts_courses AUTO_INCREMENT = 1;
ALTER TABLE applications AUTO_INCREMENT = 1;
ALTER TABLE students AUTO_INCREMENT = 1;
ALTER TABLE universities AUTO_INCREMENT = 1;
ALTER TABLE ielts_materials AUTO_INCREMENT = 1;
ALTER TABLE mock_test_questions AUTO_INCREMENT = 1;

SELECT 'Database cleared! All tables are empty and IDs reset to 1.' AS status;

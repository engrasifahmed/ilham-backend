-- =====================================================
-- CLEAR ALL DATA AND RESET AUTO-INCREMENT IDs
-- Run this in phpMyAdmin SQL tab
-- =====================================================

USE ilham;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all tables (in correct order to avoid FK errors)
TRUNCATE TABLE payments;
TRUNCATE TABLE invoices;
TRUNCATE TABLE reminders;
TRUNCATE TABLE notifications;
TRUNCATE TABLE ielts_results;
TRUNCATE TABLE ielts_mock_tests;
TRUNCATE TABLE ielts_enrollments;
TRUNCATE TABLE ielts_courses;
TRUNCATE TABLE applications;
TRUNCATE TABLE guardians;
TRUNCATE TABLE free_ielts_materials;
TRUNCATE TABLE students;
TRUNCATE TABLE universities;
TRUNCATE TABLE users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment to 1 for all tables
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE invoices AUTO_INCREMENT = 1;
ALTER TABLE reminders AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE ielts_results AUTO_INCREMENT = 1;
ALTER TABLE ielts_mock_tests AUTO_INCREMENT = 1;
ALTER TABLE ielts_enrollments AUTO_INCREMENT = 1;
ALTER TABLE ielts_courses AUTO_INCREMENT = 1;
ALTER TABLE applications AUTO_INCREMENT = 1;
ALTER TABLE guardians AUTO_INCREMENT = 1;
ALTER TABLE free_ielts_materials AUTO_INCREMENT = 1;
ALTER TABLE students AUTO_INCREMENT = 1;
ALTER TABLE universities AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Success message
SELECT 'SUCCESS: All data cleared and IDs reset to 1!' AS Result;

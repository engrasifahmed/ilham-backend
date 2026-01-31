-- Database Migration Script for ILHAM Admin Panel
-- Run this to fix schema issues and add missing columns

USE ilham;

-- Fix students table - add email and password columns if they don't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE AFTER full_name,
ADD COLUMN IF NOT EXISTS password VARCHAR(255) AFTER email;

-- Ensure created_at column exists
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Ensure guardians table has proper foreign key
ALTER TABLE guardians 
ADD CONSTRAINT IF NOT EXISTS fk_guardians_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Ensure applications table has proper foreign keys
ALTER TABLE applications
ADD CONSTRAINT IF NOT EXISTS fk_applications_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE applications
ADD CONSTRAINT IF NOT EXISTS fk_applications_university 
FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE;

-- Ensure invoices table has proper foreign key
ALTER TABLE invoices
ADD CONSTRAINT IF NOT EXISTS fk_invoices_application 
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

-- Ensure payments table has proper foreign key
ALTER TABLE payments
ADD CONSTRAINT IF NOT EXISTS fk_payments_invoice 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- Add status column to payments if it doesn't exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Completed' AFTER method;

-- Add notes column to payments if it doesn't exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS notes TEXT AFTER status;

-- Ensure IELTS tables have proper foreign keys
ALTER TABLE ielts_mock_tests
ADD CONSTRAINT IF NOT EXISTS fk_mock_tests_course 
FOREIGN KEY (course_id) REFERENCES ielts_courses(id) ON DELETE CASCADE;

ALTER TABLE ielts_results
ADD CONSTRAINT IF NOT EXISTS fk_results_mock_test 
FOREIGN KEY (mock_test_id) REFERENCES ielts_mock_tests(id) ON DELETE CASCADE;

ALTER TABLE ielts_results
ADD CONSTRAINT IF NOT EXISTS fk_results_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Add created_at to all tables that might be missing it
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Success message
SELECT 'Database migration completed successfully!' AS status;

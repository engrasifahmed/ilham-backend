-- Database Migration Script for ILHAM Admin Panel
-- Run this to fix schema issues and add missing columns

USE ilham;

-- Add email column to students table (ignore error if exists)
ALTER TABLE students ADD COLUMN email VARCHAR(255) UNIQUE AFTER full_name;

-- Add password column to students table (ignore error if exists)
ALTER TABLE students ADD COLUMN password VARCHAR(255) AFTER email;

-- Add status column to payments table (ignore error if exists)
ALTER TABLE payments ADD COLUMN status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Completed' AFTER method;

-- Add notes column to payments table (ignore error if exists)
ALTER TABLE payments ADD COLUMN notes TEXT AFTER status;

-- Success message
SELECT 'Database migration completed successfully!' AS status;

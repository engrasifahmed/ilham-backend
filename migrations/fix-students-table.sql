-- Quick fix: Add email and password columns to students table temporarily
-- Run this in phpMyAdmin if you want to keep the current code structure

ALTER TABLE students 
ADD COLUMN email VARCHAR(100) AFTER full_name,
ADD COLUMN password VARCHAR(255) AFTER email,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER photo_url;

-- Make email unique
ALTER TABLE students ADD UNIQUE KEY unique_student_email (email);

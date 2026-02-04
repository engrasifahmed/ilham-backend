-- Add ielts_requirement column to universities and populate data
USE ilham;

-- Check if column exists (implicitly handled by ADD COLUMN IF NOT EXISTS in newer MySQL, but for safety in older versions we just run ADD COLUMN and ignore duplication error or use procedure if needed. 
-- For simplicity in this environment, we'll try to ADD the column. If it fails because it exists, that's fine, we proceed to update.
-- Actually, standard SQL: just ALTER TABLE.

ALTER TABLE universities ADD COLUMN ielts_requirement VARCHAR(255) DEFAULT '6.5';

UPDATE universities SET ielts_requirement = '6.5' WHERE name = 'University of Toronto';
UPDATE universities SET ielts_requirement = '6.5' WHERE name = 'University of Melbourne';
UPDATE universities SET ielts_requirement = '7.0' WHERE name = 'University of Oxford';
UPDATE universities SET ielts_requirement = '7.0' WHERE name = 'University of Cambridge';
UPDATE universities SET ielts_requirement = '7.0' WHERE name = 'Harvard University';
UPDATE universities SET ielts_requirement = '7.0' WHERE name = 'Stanford University';
UPDATE universities SET ielts_requirement = '7.0' WHERE name = 'MIT';
UPDATE universities SET ielts_requirement = '6.5' WHERE name = 'University of Sydney';
UPDATE universities SET ielts_requirement = '7.0' WHERE name = 'ETH Zurich';
UPDATE universities SET ielts_requirement = '6.5' WHERE name = 'National University of Singapore';

SELECT 'Added ielts_requirement column and populated data' AS status;

-- Update existing universities with IELTS requirements
USE ilham;

UPDATE universities SET requirements = 'IELTS 6.5' WHERE name = 'University of Toronto';
UPDATE universities SET requirements = 'IELTS 6.5' WHERE name = 'University of Melbourne';
UPDATE universities SET requirements = 'IELTS 7.0' WHERE name = 'University of Oxford';
UPDATE universities SET requirements = 'IELTS 7.0' WHERE name = 'University of Cambridge';
UPDATE universities SET requirements = 'IELTS 7.0' WHERE name = 'Harvard University';
UPDATE universities SET requirements = 'IELTS 7.0' WHERE name = 'Stanford University';
UPDATE universities SET requirements = 'IELTS 7.0' WHERE name = 'MIT';
UPDATE universities SET requirements = 'IELTS 6.5' WHERE name = 'University of Sydney';
UPDATE universities SET requirements = 'IELTS 7.0' WHERE name = 'ETH Zurich';
UPDATE universities SET requirements = 'IELTS 6.5' WHERE name = 'National University of Singapore';

SELECT 'Universities updated with IELTS requirements!' AS status;

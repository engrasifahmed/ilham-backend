-- Add sample universities (without city column)
USE ilham;

-- Add sample universities
INSERT INTO universities (name, country) VALUES
('University of Oxford', 'United Kingdom'),
('University of Cambridge', 'United Kingdom'),
('Harvard University', 'United States'),
('Stanford University', 'United States'),
('MIT', 'United States'),
('University of Toronto', 'Canada'),
('University of Melbourne', 'Australia'),
('University of Sydney', 'Australia'),
('ETH Zurich', 'Switzerland'),
('National University of Singapore', 'Singapore')
ON DUPLICATE KEY UPDATE name=name;

SELECT 'Sample universities added!' AS status;

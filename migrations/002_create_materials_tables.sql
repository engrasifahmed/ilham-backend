-- Create IELTS Materials table
USE ilham;

CREATE TABLE IF NOT EXISTS ielts_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  material_type ENUM('PDF', 'Video', 'Audio', 'Link', 'Document') NOT NULL,
  file_url VARCHAR(500),
  course_id INT,
  is_free BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES ielts_courses(id) ON DELETE SET NULL
);

-- Create Mock Test Questions table
CREATE TABLE IF NOT EXISTS mock_test_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mock_test_id INT NOT NULL,
  section ENUM('Listening', 'Reading', 'Writing', 'Speaking') NOT NULL,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50),
  options JSON,
  correct_answer TEXT,
  points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mock_test_id) REFERENCES ielts_mock_tests(id) ON DELETE CASCADE
);

SELECT 'IELTS materials tables created successfully!' AS status;

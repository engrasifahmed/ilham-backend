-- ============================================================================
-- Database Fix Migration Script
-- Created: 2026-01-27
-- Description: Fixes data inconsistencies, removes redundant columns, 
--              adds missing triggers, indexes, and constraints
-- ============================================================================

-- Start transaction
START TRANSACTION;

-- ============================================================================
-- SECTION 1: Fix Data Inconsistencies
-- ============================================================================

-- Fix guardian data (currently has wrong data in wrong columns)
-- Note: You'll need to manually verify and update this with correct data
UPDATE `guardians` 
SET 
  `guardian_name` = 'UPDATE_WITH_ACTUAL_NAME',
  `guardian_phone` = 'UPDATE_WITH_ACTUAL_PHONE',
  `relationship_to_student` = 'UPDATE_WITH_RELATIONSHIP'
WHERE `id` = 1;

-- ============================================================================
-- SECTION 2: Remove Redundant Columns
-- ============================================================================

-- Remove redundant password column from students table
-- (Authentication is handled via users table)
ALTER TABLE `students` 
DROP COLUMN `password`;

-- ============================================================================
-- SECTION 3: Add Missing Triggers
-- ============================================================================

-- Add trigger for application rejections
DELIMITER $$
CREATE TRIGGER `after_application_rejected` 
AFTER UPDATE ON `applications` 
FOR EACH ROW 
BEGIN
  DECLARE v_student_id INT;
  DECLARE v_university_name VARCHAR(150);

  -- Only trigger when status changes TO 'Rejected'
  IF OLD.status <> 'Rejected' AND NEW.status = 'Rejected' THEN

    -- Get student_id
    SELECT student_id
    INTO v_student_id
    FROM applications
    WHERE id = NEW.id;

    -- Get university name for better notification message
    SELECT name
    INTO v_university_name
    FROM universities
    WHERE id = NEW.university_id;

    -- Insert notification
    INSERT INTO notifications (student_id, message, is_read, created_at)
    VALUES (
      v_student_id,
      CONCAT(
        'Your application to ',
        v_university_name,
        ' has been rejected. You may apply again.'
      ),
      0,
      NOW()
    );
  END IF;

END$$
DELIMITER ;

-- ============================================================================
-- SECTION 4: Add Performance Indexes
-- ============================================================================

-- Index on applications.status for filtering
CREATE INDEX `idx_applications_status` ON `applications` (`status`);

-- Index on notifications.is_read for filtering unread notifications
CREATE INDEX `idx_notifications_is_read` ON `notifications` (`is_read`);

-- Index on invoices.status for filtering unpaid invoices
CREATE INDEX `idx_invoices_status` ON `invoices` (`status`);

-- Index on payments.payment_date for date-range queries
CREATE INDEX `idx_payments_payment_date` ON `payments` (`payment_date`);

-- Composite index for student notifications (common query pattern)
CREATE INDEX `idx_notifications_student_read` ON `notifications` (`student_id`, `is_read`);

-- Index on applications created_at for sorting
CREATE INDEX `idx_applications_created_at` ON `applications` (`created_at`);

-- ============================================================================
-- SECTION 5: Add Audit Fields (updated_at)
-- ============================================================================

-- Add updated_at to applications
ALTER TABLE `applications` 
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add updated_at to students
ALTER TABLE `students` 
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add updated_at to universities
ALTER TABLE `universities` 
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add updated_at to invoices
ALTER TABLE `invoices` 
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add updated_at to ielts_courses
ALTER TABLE `ielts_courses` 
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add updated_at to ielts_materials
ALTER TABLE `ielts_materials` 
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================================
-- SECTION 6: Add Validation Constraints
-- ============================================================================

-- Add CHECK constraint for IELTS scores (0-9 in 0.5 increments)
ALTER TABLE `ielts_results`
ADD CONSTRAINT `chk_listening_score` CHECK (`listening` >= 0 AND `listening` <= 9 AND MOD(`listening` * 2, 1) = 0),
ADD CONSTRAINT `chk_reading_score` CHECK (`reading` >= 0 AND `reading` <= 9 AND MOD(`reading` * 2, 1) = 0),
ADD CONSTRAINT `chk_writing_score` CHECK (`writing` >= 0 AND `writing` <= 9 AND MOD(`writing` * 2, 1) = 0),
ADD CONSTRAINT `chk_speaking_score` CHECK (`speaking` >= 0 AND `speaking` <= 9 AND MOD(`speaking` * 2, 1) = 0),
ADD CONSTRAINT `chk_overall_score` CHECK (`overall` >= 0 AND `overall` <= 9 AND MOD(`overall` * 2, 1) = 0);

-- Add CHECK constraint for invoice amount (must be positive)
ALTER TABLE `invoices`
ADD CONSTRAINT `chk_invoice_amount` CHECK (`amount` > 0);

-- Add CHECK constraint for payment amount (must be positive)
ALTER TABLE `payments`
ADD CONSTRAINT `chk_payment_amount` CHECK (`amount` > 0);

-- ============================================================================
-- SECTION 7: Add Missing Tables (Optional but Recommended)
-- ============================================================================

-- Table for storing student documents
CREATE TABLE IF NOT EXISTS `student_documents` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `student_id` INT(11) NOT NULL,
  `document_type` ENUM('Transcript', 'Certificate', 'Passport', 'Photo', 'Recommendation Letter', 'Other') NOT NULL,
  `document_name` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verified` TINYINT(1) DEFAULT 0,
  `verified_by` INT(11) DEFAULT NULL,
  `verified_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_documents_student` (`student_id`),
  KEY `fk_student_documents_verified_by` (`verified_by`),
  CONSTRAINT `fk_student_documents_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_student_documents_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for application status history/timeline
CREATE TABLE IF NOT EXISTS `application_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `application_id` INT(11) NOT NULL,
  `old_status` ENUM('Applied','Approved','Rejected') DEFAULT NULL,
  `new_status` ENUM('Applied','Approved','Rejected') NOT NULL,
  `changed_by` INT(11) DEFAULT NULL,
  `remark` TEXT DEFAULT NULL,
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_app_history_application` (`application_id`),
  KEY `fk_app_history_changed_by` (`changed_by`),
  CONSTRAINT `fk_app_history_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_app_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for counselor assignments
CREATE TABLE IF NOT EXISTS `counselor_assignments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `student_id` INT(11) NOT NULL,
  `counselor_id` INT(11) NOT NULL,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_active_student_counselor` (`student_id`, `is_active`),
  KEY `fk_counselor_assign_student` (`student_id`),
  KEY `fk_counselor_assign_counselor` (`counselor_id`),
  CONSTRAINT `fk_counselor_assign_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_counselor_assign_counselor` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 8: Add Trigger for Application History
-- ============================================================================

DELIMITER $$
CREATE TRIGGER `after_application_status_change` 
AFTER UPDATE ON `applications` 
FOR EACH ROW 
BEGIN
  -- Log status changes to history table
  IF OLD.status <> NEW.status THEN
    INSERT INTO application_history (application_id, old_status, new_status, remark, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.counselor_remark, NOW());
  END IF;
END$$
DELIMITER ;

-- ============================================================================
-- SECTION 9: Add Trigger to Update Invoice Status on Payment
-- ============================================================================

DELIMITER $$
CREATE TRIGGER `after_payment_update_invoice` 
AFTER INSERT ON `payments` 
FOR EACH ROW 
BEGIN
  DECLARE v_total_paid DECIMAL(10,2);
  DECLARE v_invoice_amount DECIMAL(10,2);

  -- Calculate total paid for this invoice
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id;

  -- Get invoice amount
  SELECT amount
  INTO v_invoice_amount
  FROM invoices
  WHERE id = NEW.invoice_id;

  -- Update invoice status if fully paid
  IF v_total_paid >= v_invoice_amount THEN
    UPDATE invoices
    SET status = 'Paid'
    WHERE id = NEW.invoice_id;
  END IF;
END$$
DELIMITER ;

-- ============================================================================
-- SECTION 10: Create Views for Common Queries
-- ============================================================================

-- View for student application summary
CREATE OR REPLACE VIEW `v_student_applications` AS
SELECT 
  s.id AS student_id,
  s.full_name,
  s.email,
  a.id AS application_id,
  u.name AS university_name,
  u.country,
  a.status,
  a.created_at AS applied_at,
  i.amount AS invoice_amount,
  i.status AS invoice_status,
  COALESCE(SUM(p.amount), 0) AS total_paid
FROM students s
LEFT JOIN applications a ON s.id = a.student_id
LEFT JOIN universities u ON a.university_id = u.id
LEFT JOIN invoices i ON a.id = i.application_id
LEFT JOIN payments p ON i.id = p.invoice_id
GROUP BY s.id, s.full_name, s.email, a.id, u.name, u.country, a.status, a.created_at, i.amount, i.status;

-- View for unread notifications per student
CREATE OR REPLACE VIEW `v_unread_notifications` AS
SELECT 
  s.id AS student_id,
  s.full_name,
  s.email,
  COUNT(n.id) AS unread_count
FROM students s
LEFT JOIN notifications n ON s.id = n.student_id AND n.is_read = 0
GROUP BY s.id, s.full_name, s.email;

-- View for unpaid invoices
CREATE OR REPLACE VIEW `v_unpaid_invoices` AS
SELECT 
  i.id AS invoice_id,
  s.id AS student_id,
  s.full_name,
  s.email,
  u.name AS university_name,
  i.amount AS invoice_amount,
  COALESCE(SUM(p.amount), 0) AS total_paid,
  (i.amount - COALESCE(SUM(p.amount), 0)) AS balance_due,
  i.created_at AS invoice_date
FROM invoices i
JOIN applications a ON i.application_id = a.id
JOIN students s ON a.student_id = s.id
JOIN universities u ON a.university_id = u.id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.status = 'Unpaid'
GROUP BY i.id, s.id, s.full_name, s.email, u.name, i.amount, i.created_at
HAVING balance_due > 0;

-- ============================================================================
-- Commit transaction
-- ============================================================================

COMMIT;

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. Before running this script, BACKUP YOUR DATABASE!
-- 2. Update the guardian data fix in SECTION 1 with actual correct data
-- 3. Test this script on a development database first
-- 4. Some sections (like new tables) are optional - comment out if not needed
-- 5. After running, verify all triggers are working correctly
-- ============================================================================

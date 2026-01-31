-- ============================================================================
-- Migration Status Verification Script
-- Created: 2026-01-27
-- Description: Check which parts of the migration have been applied
-- ============================================================================

-- Check if password column still exists in students table
SELECT 
  COLUMN_NAME,
  DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ilham' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'password';
-- Expected: Should return 0 rows if migration applied

-- Check if updated_at columns exist
SELECT 
  TABLE_NAME,
  COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ilham' 
  AND COLUMN_NAME = 'updated_at'
ORDER BY TABLE_NAME;
-- Expected: Should show updated_at in applications, students, universities, invoices, ielts_courses, ielts_materials

-- Check if new indexes exist
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'ilham'
  AND INDEX_NAME IN (
    'idx_applications_status',
    'idx_notifications_is_read',
    'idx_invoices_status',
    'idx_payments_payment_date',
    'idx_notifications_student_read',
    'idx_applications_created_at'
  )
ORDER BY TABLE_NAME, INDEX_NAME;
-- Expected: Should return 6 rows if all indexes created

-- Check if new triggers exist
SELECT 
  TRIGGER_NAME,
  EVENT_MANIPULATION,
  EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'ilham'
ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME;
-- Expected: Should include after_application_rejected, after_application_status_change, after_payment_update_invoice

-- Check if new tables exist
SELECT 
  TABLE_NAME,
  TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ilham'
  AND TABLE_NAME IN ('student_documents', 'application_history', 'counselor_assignments')
ORDER BY TABLE_NAME;
-- Expected: Should return 3 rows if all new tables created

-- Check if views exist
SELECT 
  TABLE_NAME,
  TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ilham'
  AND TABLE_TYPE = 'VIEW'
ORDER BY TABLE_NAME;
-- Expected: Should show v_student_applications, v_unread_notifications, v_unpaid_invoices

-- Check guardian data
SELECT * FROM guardians;
-- Expected: Should have real data, not placeholder text

-- Summary report
SELECT 
  'Migration Status Check' AS report_type,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'ilham' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'password') AS password_column_exists,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'ilham' AND COLUMN_NAME = 'updated_at') AS updated_at_columns_count,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = 'ilham' AND INDEX_NAME LIKE 'idx_%') AS performance_indexes_count,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS 
   WHERE TRIGGER_SCHEMA = 'ilham') AS triggers_count,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_SCHEMA = 'ilham' AND TABLE_NAME IN ('student_documents', 'application_history', 'counselor_assignments')) AS new_tables_count,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_SCHEMA = 'ilham' AND TABLE_TYPE = 'VIEW') AS views_count;

-- ============================================================================
-- INTERPRETATION:
-- ============================================================================
-- password_column_exists: Should be 0 (if 1, migration not applied)
-- updated_at_columns_count: Should be 6 (applications, students, universities, invoices, ielts_courses, ielts_materials)
-- performance_indexes_count: Should be at least 7 (6 new + existing idx_students_email)
-- triggers_count: Should be at least 6 (3 original + 3 new)
-- new_tables_count: Should be 3 (student_documents, application_history, counselor_assignments)
-- views_count: Should be 3 (v_student_applications, v_unread_notifications, v_unpaid_invoices)
-- ============================================================================

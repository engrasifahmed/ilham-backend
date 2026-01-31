# XAMPP MySQL Migration Guide

## Step 1: Start MySQL in XAMPP

1. Open **XAMPP Control Panel**
2. Find the **MySQL** row
3. Click the **Start** button next to MySQL
4. Wait until the status shows "Running" (green background)

## Step 2: Run the Migration

Once MySQL is running, execute the migration script:

```bash
node migrations/apply-fixes.js
```

## What the Migration Will Do

The migration script will automatically apply the following fixes to your database:

### ✅ Schema Improvements
- Remove redundant `password` column from `students` table
- Add `updated_at` timestamp to 6 tables for audit tracking

### ✅ Performance Enhancements
- Add 6 indexes for faster queries:
  - `idx_applications_status`
  - `idx_notifications_is_read`
  - `idx_invoices_status`
  - `idx_payments_payment_date`
  - `idx_applications_created_at`
  - `idx_notifications_student_read` (composite)

### ✅ Data Validation
- IELTS score constraints (0-9 in 0.5 increments)
- Invoice amount validation (must be positive)
- Payment amount validation (must be positive)

### ✅ New Triggers
- `after_application_rejected` - Sends notification when application is rejected
- `after_application_status_change` - Logs all status changes to history
- `after_payment_update_invoice` - Auto-updates invoice status when fully paid

### ✅ New Tables
- `student_documents` - Store and track student documents
- `application_history` - Track all application status changes
- `counselor_assignments` - Manage student-counselor relationships

### ✅ Database Views
- `v_student_applications` - Complete student application summary
- `v_unread_notifications` - Count unread notifications per student
- `v_unpaid_invoices` - List unpaid invoices with balance due

## Troubleshooting

### If MySQL won't start in XAMPP:
1. Check if port 3306 is already in use
2. Check XAMPP error logs
3. Try restarting XAMPP Control Panel as Administrator

### If migration fails:
1. Make sure MySQL is running
2. Check that you can connect to the database
3. Verify database credentials in `db.js`

## After Migration

Once the migration completes successfully, you'll see:
```
✅ Migration completed successfully!

📊 Summary:
   - Removed redundant password column
   - Added 3 new triggers
   - Added 6 performance indexes
   - Added updated_at to 6 tables
   - Added validation constraints
   - Created 3 new tables
   - Created 3 database views

✓ Database connection closed
```

Your database will then be fully optimized and ready to use!

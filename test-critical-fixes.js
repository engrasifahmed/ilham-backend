/**
 * Test script to verify critical fixes
 * Run this after server is started
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test credentials (update these with actual test accounts)
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';
const STUDENT_TOKEN = 'YOUR_STUDENT_TOKEN_HERE';

async function runTests() {
    console.log('🧪 Starting verification tests...\n');

    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Billing - Student can view invoices
    try {
        console.log('Test 1: GET /api/billing/invoices (Student)');
        const response = await axios.get(`${BASE_URL}/api/billing/invoices`, {
            headers: { Authorization: `Bearer ${STUDENT_TOKEN}` }
        });
        console.log('✅ PASS - Invoices endpoint working');
        console.log(`   Found ${response.data.length} invoices\n`);
        testsPassed++;
    } catch (error) {
        console.log('❌ FAIL - Invoices endpoint error:', error.response?.data || error.message);
        console.log('   This might be expected if student has no invoices\n');
        testsFailed++;
    }

    // Test 2: Billing - Student can view payments
    try {
        console.log('Test 2: GET /api/billing/payments (Student)');
        const response = await axios.get(`${BASE_URL}/api/billing/payments`, {
            headers: { Authorization: `Bearer ${STUDENT_TOKEN}` }
        });
        console.log('✅ PASS - Payments endpoint working');
        console.log(`   Found ${response.data.length} payments\n`);
        testsPassed++;
    } catch (error) {
        console.log('❌ FAIL - Payments endpoint error:', error.response?.data || error.message, '\n');
        testsFailed++;
    }

    // Test 3: Admin Dashboard Views - Unpaid Invoices
    try {
        console.log('Test 3: GET /api/admin/unpaid-invoices (Admin)');
        const response = await axios.get(`${BASE_URL}/api/admin/unpaid-invoices`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log('✅ PASS - Unpaid invoices view working');
        console.log(`   Found ${response.data.length} unpaid invoices\n`);
        testsPassed++;
    } catch (error) {
        console.log('❌ FAIL - Unpaid invoices error:', error.response?.data || error.message, '\n');
        testsFailed++;
    }

    // Test 4: Admin Dashboard Views - Unread Notifications
    try {
        console.log('Test 4: GET /api/admin/unread-notifications (Admin)');
        const response = await axios.get(`${BASE_URL}/api/admin/unread-notifications`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log('✅ PASS - Unread notifications view working');
        console.log(`   Found ${response.data.length} students with unread notifications\n`);
        testsPassed++;
    } catch (error) {
        console.log('❌ FAIL - Unread notifications error:', error.response?.data || error.message, '\n');
        testsFailed++;
    }

    // Test 5: Admin Dashboard Views - Student Applications Summary
    try {
        console.log('Test 5: GET /api/admin/student-applications-summary (Admin)');
        const response = await axios.get(`${BASE_URL}/api/admin/student-applications-summary`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log('✅ PASS - Student applications summary view working');
        console.log(`   Found ${response.data.length} applications\n`);
        testsPassed++;
    } catch (error) {
        console.log('❌ FAIL - Applications summary error:', error.response?.data || error.message, '\n');
        testsFailed++;
    }

    // Test 6: Admin Dashboard
    try {
        console.log('Test 6: GET /api/admin/dashboard (Admin)');
        const response = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log('✅ PASS - Admin dashboard working');
        console.log(`   Dashboard data:`, JSON.stringify(response.data, null, 2), '\n');
        testsPassed++;
    } catch (error) {
        console.log('❌ FAIL - Admin dashboard error:', error.response?.data || error.message, '\n');
        testsFailed++;
    }

    // Summary
    console.log('='.repeat(60));
    console.log(`\n📊 Test Summary:`);
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log(`   Total: ${testsPassed + testsFailed}\n`);

    if (testsFailed === 0) {
        console.log('🎉 All tests passed! The critical fixes are working.\n');
    } else {
        console.log('⚠️  Some tests failed. Check the error messages above.\n');
        console.log('💡 Tips:');
        console.log('   - Make sure you updated the ADMIN_TOKEN and STUDENT_TOKEN');
        console.log('   - Ensure the server is running on port 4000');
        console.log('   - Check if the student/admin accounts exist\n');
    }
}

// Instructions for manual testing
function printManualTestInstructions() {
    console.log('\n📝 Manual Test Instructions:\n');
    console.log('To test reapplication flow manually:');
    console.log('1. Login as a student');
    console.log('2. Apply to a university');
    console.log('3. Login as admin and reject the application');
    console.log('4. Login as student again and try to reapply to same university');
    console.log('5. ✅ Should succeed (previously this would fail)\n');
    console.log('To get test tokens:');
    console.log('1. Use your browser\'s dev tools network tab');
    console.log('2. Login as student/admin in the frontend');
    console.log('3. Copy the token from the response');
    console.log('4. Update ADMIN_TOKEN and STUDENT_TOKEN in this file\n');
}

if (require.main === module) {
    if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE' || STUDENT_TOKEN === 'YOUR_STUDENT_TOKEN_HERE') {
        console.log('⚠️  Please update ADMIN_TOKEN and STUDENT_TOKEN in the test file first!\n');
        printManualTestInstructions();
    } else {
        runTests().catch(console.error);
    }
}

module.exports = { runTests };

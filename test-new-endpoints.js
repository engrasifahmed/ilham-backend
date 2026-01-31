/**
 * API Test Script for New Endpoints
 * 
 * This script tests all new backend endpoints to verify they're working correctly.
 * 
 * Prerequisites:
 * 1. MySQL server running (XAMPP)
 * 2. Backend server running (node app.js)
 * 3. Valid admin token
 * 
 * Usage:
 * 1. Update the TOKEN variable below with a valid admin JWT token
 * 2. Run: node test-new-endpoints.js
 */

const API_BASE = 'http://localhost:4000/api';
const TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Get this from /api/auth/login

// Test configuration
const TEST_STUDENT_ID = 7; // Change to a valid student ID in your database
const TEST_COUNSELOR_ID = 2; // Change to a valid counselor user ID
const TEST_APPLICATION_ID = 1; // Change to a valid application ID

async function testEndpoint(name, method, url, body = null) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`${method} ${url}`);
    console.log('='.repeat(60));

    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS');
            console.log('Response:', JSON.stringify(data, null, 2));
            return { success: true, data };
        } else {
            console.log('❌ FAILED');
            console.log('Status:', response.status);
            console.log('Error:', JSON.stringify(data, null, 2));
            return { success: false, error: data };
        }
    } catch (error) {
        console.log('❌ ERROR');
        console.log('Message:', error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('\n' + '█'.repeat(60));
    console.log('  ILHAM BACKEND - NEW ENDPOINTS TEST SUITE');
    console.log('█'.repeat(60));

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Test 1: Get all counselors
    let result = await testEndpoint(
        'Get All Counselors',
        'GET',
        `${API_BASE}/counselors/list`
    );
    results.tests.push({ name: 'Get All Counselors', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 2: Get counselor for student
    result = await testEndpoint(
        'Get Counselor for Student',
        'GET',
        `${API_BASE}/counselors/student/${TEST_STUDENT_ID}`
    );
    results.tests.push({ name: 'Get Counselor for Student', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 3: Get all counselor assignments
    result = await testEndpoint(
        'Get All Counselor Assignments',
        'GET',
        `${API_BASE}/counselors/assignments`
    );
    results.tests.push({ name: 'Get All Counselor Assignments', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 4: Get documents for student
    result = await testEndpoint(
        'Get Documents for Student',
        'GET',
        `${API_BASE}/documents/student/${TEST_STUDENT_ID}`
    );
    results.tests.push({ name: 'Get Documents for Student', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 5: Get all documents (admin)
    result = await testEndpoint(
        'Get All Documents',
        'GET',
        `${API_BASE}/documents`
    );
    results.tests.push({ name: 'Get All Documents', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 6: Get application history
    result = await testEndpoint(
        'Get Application History',
        'GET',
        `${API_BASE}/applications/${TEST_APPLICATION_ID}/history`
    );
    results.tests.push({ name: 'Get Application History', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 7: Get unpaid invoices (using view)
    result = await testEndpoint(
        'Get Unpaid Invoices',
        'GET',
        `${API_BASE}/admin/unpaid-invoices`
    );
    results.tests.push({ name: 'Get Unpaid Invoices', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 8: Get unread notifications (using view)
    result = await testEndpoint(
        'Get Unread Notifications',
        'GET',
        `${API_BASE}/admin/unread-notifications`
    );
    results.tests.push({ name: 'Get Unread Notifications', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 9: Get student applications summary (using view)
    result = await testEndpoint(
        'Get Student Applications Summary',
        'GET',
        `${API_BASE}/admin/student-applications-summary`
    );
    results.tests.push({ name: 'Get Student Applications Summary', ...result });
    result.success ? results.passed++ : results.failed++;

    // Test 10: Assign counselor to student
    result = await testEndpoint(
        'Assign Counselor to Student',
        'POST',
        `${API_BASE}/counselors/assign`,
        {
            student_id: TEST_STUDENT_ID,
            counselor_id: TEST_COUNSELOR_ID
        }
    );
    results.tests.push({ name: 'Assign Counselor to Student', ...result });
    result.success ? results.passed++ : results.failed++;

    // Print summary
    console.log('\n\n' + '█'.repeat(60));
    console.log('  TEST SUMMARY');
    console.log('█'.repeat(60));
    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('█'.repeat(60));

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Backend is ready for frontend integration.\n');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
        console.log('Common issues:');
        console.log('- Invalid TOKEN (get a new one from /api/auth/login)');
        console.log('- MySQL server not running');
        console.log('- Backend server not running');
        console.log('- Invalid test IDs (update TEST_STUDENT_ID, TEST_COUNSELOR_ID, TEST_APPLICATION_ID)');
        console.log('');
    }
}

// Check if TOKEN is set
if (TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.log('\n❌ ERROR: Please set a valid admin TOKEN in the script first!\n');
    console.log('To get a token:');
    console.log('1. Start the backend: node app.js');
    console.log('2. Login as admin:');
    console.log('   POST http://localhost:4000/api/auth/login');
    console.log('   Body: { "email": "admin@ilham.edu", "password": "your_password" }');
    console.log('3. Copy the token from the response');
    console.log('4. Update the TOKEN variable in this script');
    console.log('5. Run this script again\n');
    process.exit(1);
}

// Run tests
runTests().catch(console.error);

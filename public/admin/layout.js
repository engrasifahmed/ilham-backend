// ============================
// AUTH GUARD & TOKEN MANAGEMENT
// ============================

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return token;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// ============================
// API WRAPPER
// ============================

async function api(url, options = {}) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        // Handle token expiry
        if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        if (!response.ok) {
            let errorMessage = 'Request failed';
            try {
                const error = await response.json();
                errorMessage = error.message || error.error || JSON.stringify(error);
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            console.error('API Error Response:', errorMessage);
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================
// NAVBAR RENDERING
// ============================

function renderNavbar() {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;

    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';

    navbarContainer.innerHTML = `
    <div class="navbar">
      <div class="logo">ILHAM ADMIN</div>
      <a href="dashboard.html" class="${currentPage === 'dashboard' ? 'active' : ''}">Dashboard</a>
      <a href="applications.html" class="${currentPage === 'applications' ? 'active' : ''}">Applications</a>
      <a href="students.html" class="${currentPage === 'students' ? 'active' : ''}">Students</a>
      <a href="universities.html" class="${currentPage === 'universities' ? 'active' : ''}">Universities</a>
      <a href="ielts-courses.html" class="${currentPage === 'ielts-courses' ? 'active' : ''}">IELTS Courses</a>
      <a href="ielts-materials.html" class="${currentPage === 'ielts-materials' ? 'active' : ''}">IELTS Materials</a>
      <a href="invoices.html" class="${currentPage === 'invoices' ? 'active' : ''}">Invoices</a>
      <a href="payments.html" class="${currentPage === 'payments' ? 'active' : ''}">Payments</a>
      <a href="notifications.html" class="${currentPage === 'notifications' ? 'active' : ''}">Notifications</a>
      <a href="reminders.html" class="${currentPage === 'reminders' ? 'active' : ''}">Reminders</a>
      <a href="#" onclick="logout()" class="logout">Logout</a>
    </div>
  `;
}

// ============================
// UTILITY FUNCTIONS
// ============================

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return `৳ ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function getStatusBadge(status) {
    const statusMap = {
        'Approved': 'success',
        'Rejected': 'danger',
        'Applied': 'info',
        'Pending': 'warning',
        'Paid': 'success',
        'Unpaid': 'danger'
    };

    const badgeType = statusMap[status] || 'info';
    return `<span class="badge ${badgeType}">${status}</span>`;
}

// ============================
// INITIALIZATION
// ============================

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();

    // Render navbar
    renderNavbar();
});

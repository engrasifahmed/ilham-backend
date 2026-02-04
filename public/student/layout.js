// Authentication check
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return null;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { token, payload };
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return null;
    }
}

// Global Initialization
document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (auth) {
        // Try fetching profile from API (More reliable than token)
        try {
            const res = await fetch('/api/student/profile', {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (res.ok) {
                const profile = await res.json();
                const nameEl = document.getElementById('student-name');
                const avatarEl = document.getElementById('profile-avatar');

                if (nameEl) nameEl.textContent = profile.full_name || 'Student';

                // Handle Avatar
                if (avatarEl) {
                    if (profile.photo_url) {
                        avatarEl.innerHTML = `<img src="${profile.photo_url}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                        avatarEl.style.background = 'transparent';
                    } else {
                        avatarEl.textContent = (profile.full_name || 'S').charAt(0).toUpperCase();
                    }
                }
            } else {
                // Fallback to local token payload
                const nameEl = document.getElementById('student-name');
                const avatarEl = document.getElementById('profile-avatar');
                if (nameEl) nameEl.textContent = auth.payload.full_name || 'Student';
                if (avatarEl) avatarEl.textContent = (auth.payload.full_name || 'S').charAt(0).toUpperCase();
            }
        } catch (e) {
            console.error("Profile load error", e);
        }
    }

    // 2. Inject Sidebar Toggle
    const navLeft = document.querySelector('.nav-left');
    if (navLeft && !document.getElementById('sidebar-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
        toggleBtn.style.cssText = `
            background: none;
            border: none;
            color: #FFFFFF;
            cursor: pointer;
            margin-right: 16px;
            display: flex;
            align-items: center;
            z-index: 1100;
        `;
        toggleBtn.addEventListener('click', toggleSidebar);
        navLeft.insertBefore(toggleBtn, navLeft.firstChild);
    }

    // 3. Inject Notification System (Bell)
    const navRight = document.querySelector('.nav-right');
    const profileSection = document.getElementById('profile-section');
    if (navRight && profileSection && !document.getElementById('var-notif-system')) {
        const wrapper = document.createElement('div');
        wrapper.id = 'var-notif-system';
        wrapper.className = 'notif-wrapper';
        wrapper.innerHTML = `
            <button class="notif-btn" onclick="toggleNotifDropdown(event)">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span class="notif-badge" id="global-badge" style="display:none">0</span>
            </button>
            <div class="notif-dropdown" id="global-notif-dropdown">
                <div class="notif-header">
                    <span style="font-weight:600; font-size:14px; color:white;">Notifications</span>
                    <button onclick="markAllGlobalRead()" style="background:none; border:none; color:var(--student-primary); font-size:12px; cursor:pointer;">Mark all read</button>
                </div>
                <div class="notif-list" id="global-notif-list"></div>
            </div>
        `;
        navRight.insertBefore(wrapper, profileSection);

        // Inject Modal Container
        if (!document.getElementById('global-notif-modal')) {
            const modalContainer = document.createElement('div');
            modalContainer.id = 'global-notif-modal';
            modalContainer.className = 'global-modal-overlay';
            modalContainer.onclick = function (e) { closeGlobalModal(e); };
            document.body.appendChild(modalContainer);
        }

        loadGlobalNotifs();
    }

    // 4. Remove Notifications from Sidebar
    const notifLinks = document.querySelectorAll('a[href="notifications.html"]');
    notifLinks.forEach(link => {
        const li = link.closest('.sidebar-item');
        if (li) li.style.display = 'none'; // Hide instead of remove to be safe
    });
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');

    if (!sidebar) return;

    if (window.innerWidth <= 768) {
        // Mobile behavior
        sidebar.classList.toggle('active');
    } else {
        // Desktop behavior
        sidebar.classList.toggle('collapsed');
        if (main) main.classList.toggle('expanded');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format currency
function formatCurrency(amount) {
    return `RM ${parseFloat(amount || 0).toFixed(2)}`;
}

// Get status badge class
function getStatusBadge(status) {
    const statusMap = {
        'Draft': 'info',
        'Submitted': 'info',
        'Under Review': 'warning',
        'Processing': 'warning',
        'Approved': 'success',
        'Conditional': 'warning',
        'Rejected': 'danger',
        'Paid': 'success',
        'Unpaid': 'danger',
        'Pending': 'warning',
        'Completed': 'success'
    };
    return statusMap[status] || 'info';
}

// Set active sidebar link
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setActiveSidebarLink();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
document.head.appendChild(style);

/* ============================
   GLOBAL NOTIFICATION SYSTEM
============================ */
let globalNotifs = [];

async function loadGlobalNotifs() {
    const auth = checkAuth();
    if (!auth) return;
    try {
        const res = await fetch('/api/notifications/my', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
            globalNotifs = await res.json();
            updateGlobalBadge();
            renderGlobalDropdown();
        }
    } catch (e) { console.error(e); }
}

function updateGlobalBadge() {
    const badge = document.getElementById('global-badge');
    if (!badge) return;
    const unreadCount = globalNotifs.filter(n => !n.is_read).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderGlobalDropdown() {
    const list = document.getElementById('global-notif-list');
    if (!list) return;

    if (globalNotifs.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:rgba(255,255,255,0.5);">No notifications</div>';
        return;
    }

    list.innerHTML = globalNotifs.map(n => `
        <div class="notif-item ${!n.is_read ? 'unread' : ''}" onclick="openGlobalNotifModal(${n.id})">
            <div class="notif-icon">${getGlobalIcon(n.message)}</div>
            <div class="notif-content">
                <h4>${getGlobalTitle(n.message)}</h4>
                <p>${n.message}</p>
                <div class="notif-item-footer">
                    <span>${new Date(n.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleNotifDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('global-notif-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
        // Close on click outside
        if (dropdown.classList.contains('active')) {
            document.addEventListener('click', closeDropdownOutside);
        } else {
            document.removeEventListener('click', closeDropdownOutside);
        }
    }
}

function closeDropdownOutside(e) {
    const dropdown = document.getElementById('global-notif-dropdown');
    const btn = document.querySelector('.notif-btn');
    if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
        document.removeEventListener('click', closeDropdownOutside);
    }
}

function openGlobalNotifModal(id) {
    const n = globalNotifs.find(item => item.id == id);
    if (!n) return;

    // Inject modal content if not exists or update it
    let modal = document.getElementById('global-notif-modal');
    if (!modal) return;

    // Populate Modal
    modal.innerHTML = `
        <div class="global-modal-content">
             <div style="display:flex; justify-content:space-between; margin-bottom:24px;">
                <div style="display:flex; gap:16px; align-items:center;">
                    <div style="font-size:32px;">${getGlobalIcon(n.message)}</div>
                    <div>
                        <h3 style="margin:0; font-size:18px;">${getGlobalTitle(n.message)}</h3>
                        <span style="font-size:12px; color:rgba(255,255,255,0.6);">${new Date(n.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <button onclick="closeGlobalModal()" style="background:none; border:none; color:white; font-size:24px; cursor:pointer;">&times;</button>
             </div>
             <div style="font-size:16px; line-height:1.6; color:rgba(255,255,255,0.9); margin-bottom:32px;">
                ${n.message}
             </div>
             <div style="text-align:right;">
                <button class="btn btn-secondary" style="padding:8px 24px;" onclick="closeGlobalModal()">Close</button>
             </div>
        </div>
    `;

    modal.classList.add('active');

    // Mark read
    if (!n.is_read) {
        markGlobalRead(n.id);
        n.is_read = 1;
        updateGlobalBadge();
        renderGlobalDropdown();
    }
}

function closeGlobalModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById('global-notif-modal');
    if (modal) modal.classList.remove('active');
}

async function markGlobalRead(id) {
    const auth = checkAuth();
    try {
        await fetch(`/api/notifications/my/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
    } catch (e) { }
}

async function markAllGlobalRead() {
    const auth = checkAuth();
    try {
        await fetch('/api/notifications/my/read-all', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        globalNotifs.forEach(n => n.is_read = 1);
        updateGlobalBadge();
        renderGlobalDropdown();
    } catch (e) { }
}

function getGlobalIcon(msg) {
    msg = msg.toLowerCase();
    if (msg.includes('document')) return '✅';
    if (msg.includes('invoice') || msg.includes('payment')) return '💰';
    if (msg.includes('ielts')) return '📚';
    if (msg.includes('application')) return '📝';
    return '🔔';
}

function getGlobalTitle(msg) {
    msg = msg.toLowerCase();
    if (msg.includes('verified')) return 'Document Verified';
    if (msg.includes('invoice')) return 'Invoice Update';
    if (msg.includes('ielts')) return 'IELTS Update';
    if (msg.includes('application')) return 'Application Update';
    return 'Notification';
}

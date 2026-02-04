document.addEventListener('DOMContentLoaded', async () => {
    loadUniversities();
    loadIELTS();

    // Add scroll event for header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});

async function loadUniversities() {
    const grid = document.getElementById('universities-grid');
    try {
        const res = await fetch('/api/public/universities');
        if (!res.ok) throw new Error("Failed to load");

        const data = await res.json();
        const universities = data.slice(0, 4);

        if (universities.length === 0) {
            grid.innerHTML = '<p class="text-muted">No universities listed yet.</p>';
            return;
        }

        grid.innerHTML = universities.map(uni => `
            <div class="card university-card">
                <style>
                    /* Inline fallback style only for dynamic image placeholder if specific logic needed */
                    .uni-icon-placeholder {
                         height: 120px; background: #F3F4F6; display: flex; align-items: center; justify-content: center; 
                         border-radius: 16px 16px 0 0; margin: -24px -24px 20px -24px;
                         font-size: 48px;
                    }
                </style>
                <div class="uni-icon-placeholder">
                    🏛️
                </div>
                <h3>${uni.name}</h3>
                <div class="badge-container">
                    <span class="badge" style="background: #E0F2FE; color: #0284C7;">${uni.country}</span>
                    <span class="badge" style="background: #DCFCE7; color: #16A34A;">IELTS: ${uni.ielts_requirement || 'N/A'}</span>
                </div>
                <button class="btn-primary" onclick="window.location.href='/login.html'">Apply Now</button>
            </div>
        `).join('');

    } catch (error) {
        grid.innerHTML = `
            <div class="card university-card">
                <div style="padding: 24px;">
                    <h3>University of Melbourne</h3>
                    <p class="text-light">Australia</p>
                </div>
            </div>
            <!-- More fallbacks if needed -->
        `;
        console.warn("Uni Load Error", error);
    }
}

async function loadIELTS() {
    const courseGrid = document.getElementById('ielts-courses-grid');
    const materialsGrid = document.getElementById('ielts-materials-grid');

    try {
        const res = await fetch('/api/public/ielts');
        if (!res.ok) throw new Error("Failed");

        const { courses, materials } = await res.json();

        // Render Courses
        if (courses.length > 0) {
            courseGrid.innerHTML = courses.slice(0, 3).map(c => `
                <div class="ielts-grid-item">
                    <div>
                        <h4 style="margin: 0; font-size: 18px; font-weight: 600; color: var(--dark);">${c.batch_name}</h4>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-light);">
                            Starts: <span style="font-weight: 500; color: var(--primary);">${new Date(c.start_date).toLocaleDateString()}</span>
                        </p>
                    </div>
                    <button class="btn-secondary" style="padding: 8px 16px; font-size: 14px; border-radius: 8px;" onclick="window.location.href='/login.html'">Enroll</button>
                </div>
            `).join('');
        } else {
            courseGrid.innerHTML = '<p style="color: var(--text-light);">No upcoming courses.</p>';
        }

        // Render Materials (Free)
        if (materials.length > 0) {
            materialsGrid.innerHTML = materials.slice(0, 3).map(m => `
                <div class="ielts-grid-item">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 24px; color: var(--secondary);">📄</div>
                        <div>
                            <h4 style="margin: 0; font-size: 16px; font-weight: 600;">
                                <a href="${m.link || '#'}" target="_blank" style="color: var(--dark); text-decoration: none;">${m.title}</a>
                            </h4>
                            <span class="badge" style="background: #F3F4F6; color: var(--text-light); font-size: 11px; margin-top: 4px;">${m.type}</span>
                        </div>
                    </div>
                    <div style="color: var(--primary); font-size: 20px;">→</div>
                </div>
            `).join('');
        } else {
            materialsGrid.innerHTML = '<p style="color: var(--text-light);">No free materials available.</p>';
        }

    } catch (error) {
        courseGrid.innerHTML = '<p class="text-light">Login to view courses.</p>';
    }
}

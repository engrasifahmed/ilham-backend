const db = require('./db');

const createTable = `
CREATE TABLE IF NOT EXISTS site_content (
    section_key VARCHAR(100) PRIMARY KEY,
    content_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
`;

// Pre-fill with some default content if empty
const defaults = [
    { key: 'hero_title', val: 'Empowering Students to Achieve Their Academic Dreams Worldwide' },
    { key: 'hero_subtitle', val: 'Expert guidance for study abroad, admissions, scholarships, and test preparation.' },
    { key: 'about_mission', val: 'At Ilham Education Consultancy, we are dedicated to empowering students to reach their full academic potential.' },
    { key: 'contact_address', val: 'Dhaka, Bangladesh' },
    { key: 'contact_email', val: 'info@ilhameducation.com' },
    { key: 'contact_phone', val: '+880 1234567890' }
];

db.query(createTable, (err) => {
    if (err) { console.error("Create Table Error:", err); process.exit(1); }
    console.log("site_content table created/verified.");

    let pending = defaults.length;
    defaults.forEach(item => {
        db.query("INSERT IGNORE INTO site_content (section_key, content_value) VALUES (?, ?)", [item.key, item.val], (err2) => {
            if (err2) console.error("Insert Default Error:", err2);
            pending--;
            if (pending === 0) {
                console.log("Defaults inserted.");
                process.exit();
            }
        });
    });
});

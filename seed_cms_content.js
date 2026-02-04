const db = require('./db');

const ieltsContent = `
<div class="service-detail">
    <div style="display: flex; gap: 40px; align-items: center; flex-wrap: wrap; margin-bottom: 50px;">
        <div style="flex: 1; min-width: 300px;">
            <h3 style="color: var(--primary); margin-bottom: 20px;">Master the IELTS Exam</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">Our comprehensive IELTS preparation courses are designed to help you achieve your desired band score. Whether you need Academic or General Training, our expert instructors provide personalized guidance and proven strategies.</p>
            <ul style="margin-top: 20px; list-style: none; padding: 0;">
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: var(--secondary); font-size: 20px;">✓</span> 
                    <strong>Expert Instructors:</strong> Learn from certified trainers with years of experience.
                </li>
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: var(--secondary); font-size: 20px;">✓</span>
                    <strong>Mock Tests:</strong> Regular practice tests to track your progress.
                </li>
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: var(--secondary); font-size: 20px;">✓</span>
                    <strong>Comprehensive Materials:</strong> Access to exclusive study guides and practice resources.
                </li>
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: var(--secondary); font-size: 20px;">✓</span>
                    <strong>Flexible Timing:</strong> Weekend and weekday batches available.
                </li>
            </ul>
        </div>
        <div style="flex: 1; min-width: 300px; height: 300px; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
            <div style="font-size: 80px; opacity: 0.2;">📚</div>
            <!-- Decorative circles -->
            <div style="position: absolute; width: 100px; height: 100px; background: var(--primary); opacity: 0.1; border-radius: 50%; top: -20px; right: -20px;"></div>
            <div style="position: absolute; width: 60px; height: 60px; background: var(--secondary); opacity: 0.1; border-radius: 50%; bottom: 20px; left: 20px;"></div>
        </div>
    </div>
    
    <div style="margin-top: 60px;">
        <h3 style="text-align: center; margin-bottom: 40px; color: #333;">Choose Your Course</h3>
        <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
            <div class="card" style="text-align: center; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee; transition: transform 0.3s ease;">
                <div style="font-size: 40px; margin-bottom: 20px;">🎓</div>
                <h4 style="margin-bottom: 10px; color: var(--primary);">IELTS Academic</h4>
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">For students planning to study abroad at undergraduate or postgraduate levels.</p>
                <button class="btn-primary" style="width: 100%; padding: 10px; border: none; border-radius: 8px; cursor: pointer; background: var(--primary); color: white;" onclick="window.location.href='#contact'">Enquire Now</button>
            </div>
             <div class="card" style="text-align: center; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee; transition: transform 0.3s ease;">
                <div style="font-size: 40px; margin-bottom: 20px;">🌏</div>
                <h4 style="margin-bottom: 10px; color: var(--primary);">IELTS General</h4>
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">For migration to Australia, Canada, New Zealand, UK, and for secondary education.</p>
                <button class="btn-primary" style="width: 100%; padding: 10px; border: none; border-radius: 8px; cursor: pointer; background: var(--primary); color: white;" onclick="window.location.href='#contact'">Enquire Now</button>
            </div>
             <div class="card" style="text-align: center; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee; transition: transform 0.3s ease;">
                <div style="font-size: 40px; margin-bottom: 20px;">🚀</div>
                <h4 style="margin-bottom: 10px; color: var(--primary);">Crash Course</h4>
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Intensive 2-week program for quick revision and strategy mastering.</p>
                <button class="btn-primary" style="width: 100%; padding: 10px; border: none; border-radius: 8px; cursor: pointer; background: var(--primary); color: white;" onclick="window.location.href='#contact'">Enquire Now</button>
            </div>
        </div>
    </div>
</div>
`;

const studyAbroadContent = `
<div class="service-detail">
    <div style="text-align: center; max-width: 800px; margin: 0 auto 60px auto;">
        <h3 style="color: var(--primary); margin-bottom: 20px;">Your Global Education Journey Starts Here</h3>
        <p style="font-size: 18px; color: #555;">We simplify the complex process of studying abroad. From choosing the right university to landing in your dream destination, our counselors are with you every step of the way.</p>
    </div>

    <div class="timeline" style="position: relative; max-width: 800px; margin: 0 auto;">
         <!-- Step 1 -->
         <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">
            <div style="min-width: 50px; height: 50px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; flex-shrink: 0;">1</div>
            <div>
                <h4 style="margin-bottom: 5px; color: #333;">Free Counseling & Profile Evaluation</h4>
                <p style="color: #666;">We analyze your academic background, career goals, and financial preferences to recommend the best countries and universities for you.</p>
            </div>
        </div>
        <!-- Step 2 -->
        <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">
            <div style="min-width: 50px; height: 50px; background: var(--secondary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; flex-shrink: 0;">2</div>
            <div>
                <h4 style="margin-bottom: 5px; color: #333;">University Selection & Application</h4>
                <p style="color: #666;">Our team handles the paperwork, SOP editing, and application submission to ensure error-free processing and maximize acceptance chances.</p>
            </div>
        </div>
         <!-- Step 3 -->
         <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">
            <div style="min-width: 50px; height: 50px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; flex-shrink: 0;">3</div>
            <div>
                <h4 style="margin-bottom: 5px; color: #333;">Scholarship Assistance</h4>
                <p style="color: #666;">We help you identify and apply for merit-based and need-based scholarships to significantly reduce your financial burden.</p>
            </div>
        </div>
         <!-- Step 4 -->
         <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">
            <div style="min-width: 50px; height: 50px; background: var(--secondary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; flex-shrink: 0;">4</div>
            <div>
                <h4 style="margin-bottom: 5px; color: #333;">Visa Processing</h4>
                <p style="color: #666;">Expert guidance on financial documentation, visa interviews, and application filing with a high success rate.</p>
            </div>
        </div>
         <!-- Step 5 -->
         <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">
            <div style="min-width: 50px; height: 50px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; flex-shrink: 0;">5</div>
            <div>
                <h4 style="margin-bottom: 5px; color: #333;">Pre-Departure Briefing</h4>
                <p style="color: #666;">Get ready for life abroad with our tips on accommodation, flight booking, currency exchange, and cultural adaptation.</p>
            </div>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 40px; padding: 40px; background: #f8f9fa; border-radius: 20px;">
        <h3 style="margin-bottom: 20px;">Ready to take the leap?</h3>
        <button class="btn-primary" style="padding: 15px 40px; font-size: 16px; border: none; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border-radius: 30px; cursor: pointer; font-weight: 600;" onclick="window.location.href='/student-register.html'">Start Your Application</button>
    </div>
</div>
`;

// Create Table
const createTableQuery = `
CREATE TABLE IF NOT EXISTS site_content (
  section_key VARCHAR(255) PRIMARY KEY,
  content_value TEXT
)
`;

db.query(createTableQuery, (err) => {
    if (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
    console.log("Table 'site_content' ensured.");

    // Upsert Content
    const upsertQuery = `
        INSERT INTO site_content (section_key, content_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE content_value = ?
    `;

    // Insert IELTS Content
    db.query(upsertQuery, ['ielts_prep', ieltsContent, ieltsContent], (err) => {
        if (err) console.error("Error inserting IELTS content:", err);
        else console.log("IELTS content inserted.");

        // Insert Study Abroad Content
        db.query(upsertQuery, ['study_abroad', studyAbroadContent, studyAbroadContent], (err) => {
            if (err) console.error("Error inserting Study Abroad content:", err);
            else console.log("Study Abroad content inserted.");

            db.end();
            process.exit();
        });
    });
});

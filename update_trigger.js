const db = require('./db');
const drop = "DROP TRIGGER IF EXISTS after_application_status_change";
const create = `
CREATE TRIGGER after_application_status_change
AFTER UPDATE ON applications
FOR EACH ROW
BEGIN
    DECLARE uni_name VARCHAR(255);
    DECLARE u_id INT;
    
    IF OLD.status != NEW.status THEN
        INSERT INTO application_history (application_id, status, counselor_remark, changed_at)
        VALUES (NEW.id, NEW.status, NEW.counselor_remark, NOW());
        
        SELECT name INTO uni_name FROM universities WHERE id = NEW.university_id;
        SELECT user_id INTO u_id FROM students WHERE id = NEW.student_id;
        
        INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
        VALUES (u_id, 'application', 'Application Update', 
                CONCAT('Your application to ', uni_name, ' has been ', NEW.status, '.'), 
                0, NOW());
    END IF;
END
`;

db.query(drop, (err) => {
    if (err) { console.error("Drop Error:", err); process.exit(1); }
    console.log("Dropped.");
    db.query(create, (err2) => {
        if (err2) console.error("Create Error:", err2);
        else console.log("Created.");
        process.exit();
    });
});

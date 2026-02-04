const db = require('./db');
db.query("SHOW COLUMNS FROM applications", (err, res) => {
    if (res) {
        const hasProgram = res.some(c => c.Field === 'program');
        console.log("Has Program:", hasProgram);
    } else {
        console.log("Error:", err);
    }
    process.exit();
});

const db = require('./db');

function addColumn(table, col, def) {
    return new Promise((resolve) => {
        db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`, (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') console.log(`Error adding ${col}: ${err.message}`);
            else console.log(`Column ${col} ready.`);
            resolve();
        });
    });
}

async function fix() {
    console.log("Fixing missing columns...");
    await addColumn('students', 'address', 'TEXT');
    await addColumn('students', 'dob', 'DATE');
    await addColumn('students', 'ielts_score', 'VARCHAR(50)');

    // Also check phone (usually present but just in case)
    await addColumn('students', 'phone', 'VARCHAR(50)');

    console.log("Done.");
    process.exit();
}

fix();

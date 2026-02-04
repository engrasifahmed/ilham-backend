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
    console.log("Fixing application_history table...");
    await addColumn('application_history', 'status', 'VARCHAR(50)');
    await addColumn('application_history', 'counselor_remark', 'TEXT');
    await addColumn('application_history', 'changed_at', 'DATETIME');

    console.log("History table fixed.");
    process.exit();
}

fix();

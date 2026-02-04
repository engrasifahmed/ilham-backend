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
    console.log("Fixing notifications table...");
    await addColumn('notifications', 'user_id', 'INT');
    await addColumn('notifications', 'type', 'VARCHAR(50)');
    await addColumn('notifications', 'title', 'VARCHAR(255)');
    await addColumn('notifications', 'message', 'TEXT');
    await addColumn('notifications', 'is_read', 'BOOLEAN DEFAULT 0');
    // created_at usually exists
    await addColumn('notifications', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    console.log("Notifications table fixed.");
    process.exit();
}

fix();

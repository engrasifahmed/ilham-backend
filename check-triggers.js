const mysql = require('mysql2/promise');

async function checkTriggers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'ilham'
    });

    console.log('Checking for triggers that might create invoices...\n');

    // Check all triggers
    const [triggers] = await connection.query('SHOW TRIGGERS');

    console.log('All triggers in database:');
    triggers.forEach(trigger => {
        console.log(`- ${trigger.Trigger} on ${trigger.Table} (${trigger.Event})`);
    });

    console.log('\n\nChecking trigger definitions for invoice creation...\n');

    for (const trigger of triggers) {
        const [definition] = await connection.query(
            'SHOW CREATE TRIGGER ??',
            [trigger.Trigger]
        );

        const sql = definition[0]['SQL Original Statement'];
        if (sql.toLowerCase().includes('insert into invoices')) {
            console.log(`⚠️  FOUND: ${trigger.Trigger} creates invoices!`);
            console.log('Definition:');
            console.log(sql);
            console.log('\n' + '='.repeat(80) + '\n');
        }
    }

    await connection.end();
}

checkTriggers().catch(console.error);

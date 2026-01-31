const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkApplicationTriggers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'ilham'
    });

    let output = 'Checking triggers on applications table...\n\n';

    const [triggers] = await connection.query(
        "SHOW TRIGGERS WHERE `Table` = 'applications'"
    );

    if (triggers.length === 0) {
        output += 'No triggers found on applications table.\n';
    } else {
        for (const trigger of triggers) {
            output += `\nTrigger: ${trigger.Trigger}\n`;
            output += `Event: ${trigger.Event}\n`;
            output += `Timing: ${trigger.Timing}\n`;

            const [definition] = await connection.query(
                'SHOW CREATE TRIGGER ??',
                [trigger.Trigger]
            );

            const sql = definition[0]['SQL Original Statement'];
            output += '\nDefinition:\n';
            output += sql + '\n';
            output += '\n' + '='.repeat(80) + '\n';

            if (sql.toLowerCase().includes('insert into invoices')) {
                output += '\n⚠️⚠️⚠️ THIS TRIGGER CREATES INVOICES AUTOMATICALLY! ⚠️⚠️⚠️\n\n';
            }
        }
    }

    fs.writeFileSync('trigger-check-result.txt', output);
    console.log(output);
    console.log('\n✅ Output saved to trigger-check-result.txt');

    await connection.end();
}

checkApplicationTriggers().catch(console.error);

const fs = require('fs');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync('d:/ilham-backend/debug.log', logMessage);
    console.log(message);
}

module.exports = { log };

const db = require('./db');

async function checkUniversities() {
    try {
        const [uDesc] = await db.promise().query("DESCRIBE universities");
        console.log("Universities Cols:", uDesc.map(c => c.Field));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
checkUniversities();

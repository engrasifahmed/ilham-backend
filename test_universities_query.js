const db = require('./db');

const query = "SELECT name, country, ielts_requirement FROM universities LIMIT 6";
db.query(query, (err, rows) => {
    if (err) {
        console.error("Universities DB Error:", err);
    } else {
        console.log("Query Successful. Rows:", rows);
    }
    process.exit();
});

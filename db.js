const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",   // XAMPP default
  database: "ilham"
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
    return;
  }
  console.log("MySQL Connected");
});

module.exports = db;

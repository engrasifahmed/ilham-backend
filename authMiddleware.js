const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
}
function financeOnly(req, res, next) {
  if (req.role !== "FINANCE") {
    return res.status(403).json({ error: "Finance access only" });
  }
  next();
}

module.exports = { auth, adminOnly, financeOnly };

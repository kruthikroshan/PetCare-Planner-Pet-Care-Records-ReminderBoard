const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication is required." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development-only-secret");
    return next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

module.exports = { requireAuth };

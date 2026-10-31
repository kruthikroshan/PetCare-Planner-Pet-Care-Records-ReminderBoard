const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../config/jwt");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  let decoded;
  try {
    decoded = jwt.verify(match[1], getJwtSecret(), { algorithms: ["HS256"] });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    return next(error);
  }

  if (!decoded || typeof decoded !== "object" || typeof decoded.sub !== "string") {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }

  try {
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Administrator access is required." });
  return next();
}

module.exports = { requireAuth, requireAdmin };

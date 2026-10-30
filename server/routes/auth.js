const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../config/jwt");

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function tokenFor(user) {
  return jwt.sign({}, getJwtSecret(), {
    algorithm: "HS256",
    subject: user._id.toString(),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

router.post("/register", async (req, res, next) => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body.password;

  if (!name || name.length > 80 || email.length > 254 || !validEmail(email)) {
    return res.status(400).json({ message: "Enter a name of at most 80 characters and a valid email address." });
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({ message: "Password must be at least 8 characters and no more than 72 bytes." });
  }

  try {
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12)
    });
    return res.status(201).json({
      token: tokenFor(user),
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body.password;

  if (!email || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required." });
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }

  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({
      token: tokenFor(user),
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const tokenFor = (user) => jwt.sign({ id: user._id.toString(), name: user.name, email: user.email }, process.env.JWT_SECRET || "development-only-secret", { expiresIn: "7d" });
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !validEmail(email) || password.length < 8) return res.status(400).json({ message: "Enter a name, valid email, and password of at least 8 characters." });
    if (await User.exists({ email })) return res.status(409).json({ message: "An account with that email already exists." });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    return res.status(201).json({ token: tokenFor(user), user: { name: user.name, email: user.email } });
  } catch (error) { return next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash))) return res.status(401).json({ message: "Email or password is incorrect." });
    return res.json({ token: tokenFor(user), user: { name: user.name, email: user.email } });
  } catch (error) { return next(error); }
});

module.exports = router;

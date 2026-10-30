require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const { getJwtSecret } = require("./config/jwt");

const authRoutes = require("./routes/auth");
const petRoutes = require("./routes/pets");
const careRecordRoutes = require("./routes/careRecords");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/care-records", careRecordRoutes);

app.use((err, _req, res, _next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request body is too large." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON request body." });
  if (err.name === "ValidationError") return res.status(400).json({ message: "Please check the submitted fields." });
  if (err.name === "CastError") return res.status(400).json({ message: "The requested resource id is invalid." });
  console.error(err);
  return res.status(500).json({ message: "Something went wrong on the server." });
});

async function start() {
  const port = process.env.PORT || 5000;
  if (require.main === module) {
    getJwtSecret();
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/petcare_planner");
    app.listen(port, () => console.log(`API listening on port ${port}`));
  }
}

start().catch((error) => {
  console.error("Unable to start API:", error.message);
  process.exitCode = 1;
});

module.exports = app;

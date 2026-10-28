const mongoose = require("mongoose");

module.exports = mongoose.model("Pet", new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  species: { type: String, required: true, enum: ["Dog", "Cat", "Bird", "Rabbit", "Other"] },
  breed: { type: String, trim: true, maxlength: 60 },
  birthDate: { type: Date },
  notes: { type: String, trim: true, maxlength: 1000 }
}, { timestamps: true }));

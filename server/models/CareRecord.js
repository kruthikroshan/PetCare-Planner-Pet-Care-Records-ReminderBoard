const mongoose = require("mongoose");

module.exports = mongoose.model("CareRecord", new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true, index: true },
  careType: { type: String, required: true, enum: ["Vaccination", "Grooming", "Appointment", "Medication", "Other"] },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  eventDate: { type: Date, required: true },
  nextDueDate: { type: Date },
  notes: { type: String, trim: true, maxlength: 1000 },
  providerName: { type: String, trim: true, maxlength: 100 }
}, { timestamps: true }));

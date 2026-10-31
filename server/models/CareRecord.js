const mongoose = require("mongoose");

const allowedCareTypes = ["Vaccination", "Grooming", "Appointment", "Medication", "Other"];

const careRecordSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true, index: true },
  careType: { type: String, required: true, enum: ["Vaccination", "Grooming", "Appointment", "Medication", "Other"] },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  eventDate: { type: Date, required: true },
  nextDueDate: { type: Date },
  notes: { type: String, trim: true, maxlength: 1000 },
  providerName: { type: String, trim: true, maxlength: 100 }
}, { timestamps: true });

careRecordSchema.statics.validateInput = (body, { partial = false } = {}) => {
  if (!partial && (!body.title || !body.careType || !body.eventDate)) return "Care type, title, and event date are required.";
  if (body.title !== undefined && !String(body.title).trim()) return "Care record title is required.";
  if (body.careType !== undefined && !allowedCareTypes.includes(body.careType)) return "Care type is not supported.";
  if (body.eventDate !== undefined && Number.isNaN(new Date(body.eventDate).getTime())) return "Event date must be a valid date.";
  if (body.nextDueDate !== undefined && body.nextDueDate !== null && Number.isNaN(new Date(body.nextDueDate).getTime())) return "Next due date must be a valid date.";
  if (body.eventDate && body.nextDueDate && new Date(body.nextDueDate) < new Date(body.eventDate)) return "Next due date cannot be before the event date.";
  return null;
};

module.exports = mongoose.model("CareRecord", careRecordSchema);
module.exports.allowedCareTypes = allowedCareTypes;

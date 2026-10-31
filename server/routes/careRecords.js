const router = require("express").Router();
const CareRecord = require("../models/CareRecord");
const Pet = require("../models/Pet");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);
router.get("/", async (req, res, next) => {
  try {
    const filter = { ownerId: req.user.id };
    if (req.query.petId) filter.petId = req.query.petId;
    if (req.query.careType) filter.careType = req.query.careType;
    const records = await CareRecord.find(filter).populate("petId", "name").sort({ eventDate: -1 });
    return res.json(records);
  } catch (error) { return next(error); }
});
router.post("/", async (req, res, next) => {
  try {
    const pet = await Pet.exists({ _id: req.body.petId, ownerId: req.user.id });
    if (!pet) return res.status(404).json({ message: "Pet not found." });
    const validationMessage = CareRecord.validateInput(req.body);
    if (validationMessage) return res.status(400).json({ message: validationMessage });
    const { petId, careType, title, eventDate, nextDueDate, notes, providerName } = req.body;
    return res.status(201).json(await CareRecord.create({ petId, careType, title, eventDate, nextDueDate, notes, providerName, ownerId: req.user.id }));
  } catch (error) { return next(error); }
});
router.get("/upcoming", async (req, res, next) => {
  try {
    const records = await CareRecord.find({ ownerId: req.user.id, nextDueDate: { $exists: true, $ne: null } }).populate("petId", "name").sort({ nextDueDate: 1 });
    return res.json(records.map((record) => ({ ...record.toObject(), status: new Date(record.nextDueDate) < new Date() ? "overdue" : "upcoming" })));
  } catch (error) { return next(error); }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const validationMessage = CareRecord.validateInput(req.body, { partial: true });
    if (validationMessage) return res.status(400).json({ message: validationMessage });
    const allowedFields = ["careType", "title", "eventDate", "nextDueDate", "notes", "providerName"];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([field]) => allowedFields.includes(field)));
    if (!Object.keys(changes).length) return res.status(400).json({ message: "At least one care record field is required." });
    const existing = await CareRecord.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!existing) return res.status(404).json({ message: "Care record not found." });
    const merged = { ...existing.toObject(), ...changes };
    const mergedValidationMessage = CareRecord.validateInput(merged);
    if (mergedValidationMessage) return res.status(400).json({ message: mergedValidationMessage });
    const updated = await CareRecord.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, { $set: changes }, { new: true, runValidators: true });
    return res.json(updated);
  } catch (error) { return next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await CareRecord.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Care record not found." });
    return res.status(204).end();
  } catch (error) { return next(error); }
});

module.exports = router;

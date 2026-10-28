const router = require("express").Router();
const Pet = require("../models/Pet");
const CareRecord = require("../models/CareRecord");
const { requireAuth } = require("../middleware/auth");

const allowed = ["Dog", "Cat", "Bird", "Rabbit", "Other"];
const cleanPet = (body) => ({
  name: String(body.name || "").trim(),
  species: body.species,
  breed: String(body.breed || "").trim(),
  birthDate: body.birthDate || undefined,
  notes: String(body.notes || "").trim()
});

router.use(requireAuth);
router.get("/", async (req, res, next) => {
  try { return res.json(await Pet.find({ ownerId: req.user.id }).sort({ createdAt: -1 })); } catch (error) { return next(error); }
});
router.post("/", async (req, res, next) => {
  try {
    const pet = cleanPet(req.body);
    if (!pet.name || !allowed.includes(pet.species)) return res.status(400).json({ message: "Name and a supported species are required." });
    if (pet.birthDate && new Date(pet.birthDate) > new Date()) return res.status(400).json({ message: "Birth date cannot be in the future." });
    return res.status(201).json(await Pet.create({ ...pet, ownerId: req.user.id }));
  } catch (error) { return next(error); }
});
router.get("/:id", async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!pet) return res.status(404).json({ message: "Pet not found." });
    return res.json(pet);
  } catch (error) { return next(error); }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const pet = cleanPet(req.body);
    if (!pet.name || !allowed.includes(pet.species)) return res.status(400).json({ message: "Name and a supported species are required." });
    const updated = await Pet.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, pet, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Pet not found." });
    return res.json(updated);
  } catch (error) { return next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Pet.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Pet not found." });
    await CareRecord.deleteMany({ petId: deleted._id, ownerId: req.user.id });
    return res.status(204).end();
  } catch (error) { return next(error); }
});
router.get("/:id/care-records", async (req, res, next) => {
  try {
    const pet = await Pet.exists({ _id: req.params.id, ownerId: req.user.id });
    if (!pet) return res.status(404).json({ message: "Pet not found." });
    return res.json(await CareRecord.find({ petId: req.params.id, ownerId: req.user.id }).sort({ eventDate: -1 }));
  } catch (error) { return next(error); }
});
router.post("/:id/care-records", async (req, res, next) => {
  try {
    const pet = await Pet.exists({ _id: req.params.id, ownerId: req.user.id });
    if (!pet) return res.status(404).json({ message: "Pet not found." });
    const record = { ...req.body, petId: req.params.id, ownerId: req.user.id };
    if (!record.title || !record.careType || !record.eventDate) return res.status(400).json({ message: "Care type, title, and event date are required." });
    return res.status(201).json(await CareRecord.create(record));
  } catch (error) { return next(error); }
});

module.exports = router;

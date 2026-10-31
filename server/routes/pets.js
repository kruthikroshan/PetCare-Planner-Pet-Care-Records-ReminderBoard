const router = require("express").Router();
const Pet = require("../models/Pet");
const CareRecord = require("../models/CareRecord");
const { requireAuth } = require("../middleware/auth");

const allowed = ["Dog", "Cat", "Bird", "Rabbit", "Other"];
const petFields = ["name", "species", "breed", "birthDate", "notes"];
const cleanPet = (body, { partial = false } = {}) => {
  const pet = {};
  for (const field of petFields) {
    if (partial && !Object.prototype.hasOwnProperty.call(body, field)) continue;
    if (field === "name" || field === "breed" || field === "notes") pet[field] = String(body[field] || "").trim();
    else pet[field] = body[field] || undefined;
  }
  return pet;
};

const validatePet = (pet, { partial = false } = {}) => {
  if (!partial && (!pet.name || !allowed.includes(pet.species))) return "Name and a supported species are required.";
  if (pet.name !== undefined && !pet.name) return "Pet name is required.";
  if (pet.species !== undefined && !allowed.includes(pet.species)) return "Species is not supported.";
  if (pet.birthDate !== undefined && Number.isNaN(new Date(pet.birthDate).getTime())) return "Birth date must be a valid date.";
  if (pet.birthDate && new Date(pet.birthDate) > new Date()) return "Birth date cannot be in the future.";
  return null;
};

router.use(requireAuth);
router.get("/", async (req, res, next) => {
  try { return res.json(await Pet.find({ ownerId: req.user.id }).sort({ createdAt: -1 })); } catch (error) { return next(error); }
});
router.post("/", async (req, res, next) => {
  try {
    const pet = cleanPet(req.body);
    const validationMessage = validatePet(pet);
    if (validationMessage) return res.status(400).json({ message: validationMessage });
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
    const pet = cleanPet(req.body, { partial: true });
    const validationMessage = validatePet(pet, { partial: true });
    if (validationMessage) return res.status(400).json({ message: validationMessage });
    if (!Object.keys(pet).length) return res.status(400).json({ message: "At least one pet field is required." });
    const updated = await Pet.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, { $set: pet }, { new: true, runValidators: true });
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
    const validationMessage = CareRecord.validateInput(record);
    if (validationMessage) return res.status(400).json({ message: validationMessage });
    return res.status(201).json(await CareRecord.create(record));
  } catch (error) { return next(error); }
});

module.exports = router;

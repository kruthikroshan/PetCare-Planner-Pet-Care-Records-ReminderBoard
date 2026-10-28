const router = require("express").Router();
const CareRecord = require("../models/CareRecord");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);
router.get("/upcoming", async (req, res, next) => {
  try {
    const records = await CareRecord.find({ ownerId: req.user.id, nextDueDate: { $exists: true, $ne: null } }).populate("petId", "name").sort({ nextDueDate: 1 });
    return res.json(records.map((record) => ({ ...record.toObject(), status: new Date(record.nextDueDate) < new Date() ? "overdue" : "upcoming" })));
  } catch (error) { return next(error); }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const updated = await CareRecord.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Care record not found." });
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

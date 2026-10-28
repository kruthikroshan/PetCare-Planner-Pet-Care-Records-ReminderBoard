require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User");
const Pet = require("./models/Pet");
const CareRecord = require("./models/CareRecord");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/petcare_planner");
  const email = "demo@petcareplanner.com";
  const user = await User.findOneAndUpdate(
    { email },
    { name: "Demo User", email, passwordHash: await bcrypt.hash("PetCare123!", 12) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await CareRecord.deleteMany({ ownerId: user._id });
  await Pet.deleteMany({ ownerId: user._id });
  const [maple, luna] = await Pet.create([
    { ownerId: user._id, name: "Maple", species: "Dog", breed: "Golden Retriever", birthDate: "2021-04-12", notes: "Loves long walks and peanut butter." },
    { ownerId: user._id, name: "Luna", species: "Cat", breed: "Domestic Shorthair", birthDate: "2022-09-03", notes: "Indoor cat. Favorite toy is the blue mouse." }
  ]);
  await CareRecord.create([
    { ownerId: user._id, petId: maple._id, careType: "Vaccination", title: "Annual booster", eventDate: "2026-03-16", nextDueDate: "2027-03-16", providerName: "Green Paws Clinic" },
    { ownerId: user._id, petId: luna._id, careType: "Grooming", title: "Nail trimming", eventDate: "2026-10-10", nextDueDate: "2026-11-10", providerName: "Whiskers & Co." },
    { ownerId: user._id, petId: maple._id, careType: "Appointment", title: "Dental check-up", eventDate: "2026-05-04", nextDueDate: "2026-10-20", providerName: "Green Paws Clinic" }
  ]);
  console.log(`Demo account ready: ${email} / PetCare123!`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Unable to seed demo data:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});

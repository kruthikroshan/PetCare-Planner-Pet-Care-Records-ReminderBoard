<<<<<<< HEAD
# PetCare Planner

PetCare Planner is a record-keeping application for pet profiles, care records, appointments, and upcoming or overdue care dates. It is not a veterinary diagnosis or treatment service.

## Requirements

- Node.js 18+
- MongoDB running locally or a MongoDB connection string

## Setup

```powershell
cd petplanner
Copy-Item .env.example .env
npm install
Set-Location client
npm install
Set-Location ..
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:5000`.

## Sample login

After MongoDB is running, load a ready-to-use demo account with sample pets and reminders:

```powershell
npm run seed
```

Then sign in with:

- **Email:** `demo@petcareplanner.com`
- **Password:** `PetCare123!`

Running the seed command resets only this demo account's pets and care records.

## API

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET|POST /api/pets`
- `GET|PATCH|DELETE /api/pets/:id`
- `GET|POST /api/pets/:id/care-records`
- `PATCH|DELETE /api/care-records/:id`
- `GET /api/care-records/upcoming`

All pet and care-record endpoints require `Authorization: Bearer <token>`. Every query is scoped to the authenticated owner.

## Project structure

- `server/`: Express API, Mongoose models, auth middleware, and tests
- `client/`: React/Vite responsive dashboard and reusable pet UI

## Data model

`User` stores the account identity and password hash. `Pet` stores `ownerId`, profile fields, and timestamps. `CareRecord` stores `ownerId`, `petId`, care type, title, event date, optional due date, provider, and notes.

## Testing

With dependencies installed:

```powershell
npm test
npm run build
```
=======
# PetCare-Planner-Pet-Care-Records-ReminderBoard
>>>>>>> origin/main

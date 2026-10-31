# PetCare Planner

PetCare Planner is a record-keeping application for pet profiles, care records,
appointments, and upcoming or overdue care dates. It is not a veterinary
diagnosis or treatment service.

## Requirements

- Node.js 18+
- MongoDB running locally or a MongoDB connection string

## Setup

```powershell
Copy-Item .env.example .env
npm install
Set-Location client
npm install
Set-Location ..
npm run dev
```

Before starting the API, set `JWT_SECRET` in `.env` to a random secret generated with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `http://localhost:5173`. The API runs on `http://localhost:5000`.

## Sample login

After MongoDB is running, load a ready-to-use demo account with sample pets and
reminders:

```powershell
npm run seed
```

Then sign in with:

- **Email:** `demo@petcareplanner.com`
- **Password:** `PetCare123!`

The same command also creates or updates these five admin profiles:

| Email | Password |
|---|---|
| `nithin@gmail.com` | `12345678` |
| `kruthik@gmail.com` | `12345678` |
| `siddarth@gmail.com` | `12345678` |
| `vasu@gmail.com` | `12345678` |
| `meghana@gmail.com` | `12345678` |

Choose **User login** or **Admin login** on the sign-in screen. The API checks
that the selected account type matches the stored role. Running the seed command
resets only the demo account's pets and care records; it does not delete admin
profiles.

## API

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`

Pets:

- `GET|POST /api/pets`
- `GET|PATCH|DELETE /api/pets/:id`

Care records:

- `GET|POST /api/pets/:id/care-records`
- `GET|POST /api/care-records`
- `PATCH|DELETE /api/care-records/:id`
- `GET /api/care-records/upcoming`

All pet and care-record endpoints require
`Authorization: Bearer <token>`. Every query is scoped to the authenticated
owner. The collection endpoint accepts optional `petId` and `careType` filters:
`GET /api/care-records?petId=<pet-id>&careType=<care-type>`.

Pet species are `Dog`, `Cat`, `Bird`, `Rabbit`, or `Other`. Care types are
`Vaccination`, `Grooming`, `Appointment`, `Medication`, or `Other`. Birth dates
cannot be in the future, and a care record's next-due date cannot be before its
event date.

## Project structure

- `server/`: Express API, Mongoose models, auth middleware, and tests
- `client/`: React/Vite responsive dashboard and reusable pet UI

## Data model

`User` stores the account identity, password hash, and `role` (`user` or
`admin`). `Pet` stores `ownerId`,
profile fields, and timestamps. `CareRecord` stores `ownerId`, `petId`, care
type, title, event date, optional due date, provider, and notes.

## Testing

With dependencies installed:

```powershell
npm test
npm run build
```

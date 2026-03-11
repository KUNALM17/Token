# 🏥 TokenQ — Digital Hospital Queue & Appointment Management System

<p align="center">
  <strong>A production-ready healthcare management platform with digital token queues, OTP authentication, and integrated payments.</strong>
</p>

<p align="center">
  <a href="https://token-sooty-tau.vercel.app" target="_blank">🌐 Live Demo</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-tech-stack">🛠️ Tech Stack</a> •
  <a href="#-installation--setup">🚀 Installation</a> •
  <a href="#-api-documentation">📖 API Docs</a>
</p>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Live Demo](#-live-demo)
3. [Features](#-features)
4. [Tech Stack](#-tech-stack)
5. [Prerequisites](#-prerequisites)
6. [Installation & Setup](#-installation--setup)
7. [Project Structure](#-project-structure)
8. [Database Setup](#-database-setup)
9. [Seeding Data](#-seeding-data)
10. [Running the Application](#-running-the-application)
11. [API Documentation](#-api-documentation)
12. [User Roles](#-user-roles)
13. [Features Explained](#-features-explained)
14. [Deployment](#-deployment)
15. [Configuration](#-configuration)
16. [Contributing](#-contributing)
17. [License](#-license)
18. [Support & Contact](#-support--contact)

---

## 🩺 Overview

**TokenQ** is a full-stack Digital Hospital Queue & Appointment Management System designed to modernize patient flow in hospitals and clinics. It replaces traditional paper-based token systems with a real-time digital queue, enabling patients to book appointments online, track their queue position, and receive SMS notifications.

### Key Use Cases

- **Hospitals & Clinics** — Manage multiple doctors, shifts, and patient queues from a single admin dashboard.
- **Patients** — Browse hospitals, check real-time doctor availability, book appointments, and pay online.
- **Doctors** — View and manage today's patient queue, mark consultations as complete.
- **Healthcare Administrators** — Oversee hospital operations, manage staff, and export daily reports.

---

## 🌐 Live Demo

> **[https://token-sooty-tau.vercel.app](https://token-sooty-tau.vercel.app)**

Use the following test phone numbers after seeding the database (OTP appears in the backend console during development):

| Role | Phone Number |
|------|-------------|
| Super Admin | `9000000001` |
| Hospital Admin | `9000000002` |
| Doctor (Cardiology) | `9000000003` |
| Doctor (Pediatrics) | `9000000004` |
| Doctor (Dermatology) | `9000000005` |
| Patient | `9000000100` |

---

## ✨ Features

- 🎟️ **Digital Token Queue** — Sequential, concurrency-safe token assignment per doctor per shift per day
- 📱 **OTP Authentication** — Passwordless phone-based login via Fast2SMS
- 💳 **Razorpay Payments** — Integrated UPI & card payments for appointment fees
- 👥 **4 Role-Based Dashboards** — Patient, Doctor, Hospital Admin, Super Admin
- 🔄 **Queue Management** — Call Next, Skip, and Complete actions for admins and doctors
- 📅 **Shift Management** — Multiple shifts per doctor with configurable token limits and working days
- 🗓️ **Leave Management** — Mark doctor leaves; auto-block slots on leave dates
- 📊 **CSV Export** — Daily appointment export for hospital admins
- ⚡ **Auto-Shift Stale Appointments** — Automatically reschedules unviewed past appointments to today
- 🔒 **JWT-Based Security** — Role-protected API routes with middleware guards
- 📡 **Redis Caching** — Optional Upstash Redis with in-memory fallback for OTP rate limiting
- 🌐 **CORS Configured** — Environment-aware cross-origin setup for dev and production

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router | 6.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Lucide React | 0.293+ | Icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| Prisma ORM | 5.x | Database toolkit & migrations |
| JSON Web Token | 9.x | Authentication |
| Fast2SMS | — | OTP delivery via SMS |
| Razorpay | 2.x | Payment gateway |
| Redis (Upstash) | 4.x | Caching & rate limiting |
| bcrypt | 5.x | Password hashing |

### Database
| Technology | Purpose |
|-----------|---------|
| PostgreSQL 12+ | Primary relational database |
| Supabase (optional) | Managed PostgreSQL hosting |
| Prisma Migrations | Schema versioning |

---

## 📦 Prerequisites

Ensure the following are installed before proceeding:

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **npm** v9+ (bundled with Node.js) or **yarn**
- **PostgreSQL** 12+ — [Download](https://www.postgresql.org/download/) or use [Supabase](https://supabase.com/)
- **Git** — [Download](https://git-scm.com/)

Optional:
- **Docker** — for containerized PostgreSQL
- **Prisma Studio** — included via `npx prisma studio`

---

## 🚀 Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/KUNALM17/Token.git
cd Token
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Open `backend/.env` and update the following values:

```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/hospital_token_db"
JWT_SECRET="your-strong-secret-key"
```

See the [Configuration](#-configuration) section for all available environment variables.

```bash
# Run database migrations
npm run prisma:migrate

# Seed sample data
npm run prisma:seed

# Start development server
npm run dev
```

The backend API will be available at **http://localhost:5000**.

### Frontend Setup

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at **http://localhost:5173**.

---

## 📁 Project Structure

```
Token/
├── backend/                    # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (8 models)
│   │   └── seed.ts             # Demo data seeder
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authentication guard
│   │   │   ├── errorHandler.ts # Global error handler
│   │   │   └── validation.ts   # Request validation
│   │   ├── routes/
│   │   │   ├── auth.routes.ts          # OTP login/register
│   │   │   ├── patient.routes.ts       # Patient endpoints
│   │   │   ├── doctor.routes.ts        # Doctor endpoints
│   │   │   ├── hospitalAdmin.routes.ts # Admin endpoints
│   │   │   ├── superAdmin.routes.ts    # Super admin endpoints
│   │   │   └── payment.routes.ts       # Razorpay integration
│   │   ├── services/
│   │   │   ├── jwt.service.ts          # Token generation/verification
│   │   │   ├── sms.service.ts          # Fast2SMS OTP delivery
│   │   │   ├── payment.service.ts      # Razorpay order/verify
│   │   │   └── redis.service.ts        # Redis/in-memory cache
│   │   └── index.ts            # App entry point
│   ├── .env.example            # Environment variable template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx               # Phone OTP login
│   │   │   ├── PatientDashboard.tsx        # Patient view
│   │   │   ├── DoctorDashboard.tsx         # Doctor queue view
│   │   │   ├── HospitalAdminDashboard.tsx  # Admin controls
│   │   │   └── SuperAdminDashboard.tsx     # System management
│   │   ├── api.ts              # Axios API client
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── theme.tsx           # UI theme configuration
│   │   ├── App.tsx             # Routing & auth context
│   │   └── main.tsx            # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Setup

### Option 1 — Local PostgreSQL (Manual)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE hospital_token_db;
\q

# Run Prisma migrations from the backend folder
cd backend
npm run prisma:migrate
```

### Option 2 — Docker

```bash
# Start a PostgreSQL container
docker run --name tokenq-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hospital_token_db \
  -p 5432:5432 \
  -d postgres:15

# Then run migrations
cd backend
npm run prisma:migrate
```

### Option 3 — Supabase (Cloud)

1. Create a free project at [supabase.com](https://supabase.com/)
2. Copy the connection string from **Settings → Database**
3. Update `DATABASE_URL` and `DIRECT_URL` in `backend/.env`
4. Run migrations:

```bash
cd backend
npm run prisma:migrate
```

### Option 4 — Clean Reset

```bash
# ⚠️ This deletes all data and re-applies all migrations
cd backend
npx prisma migrate reset
```

### Database Schema

The database consists of **8 models**:

| Model | Description |
|-------|-------------|
| `User` | All roles (Patient, Doctor, Admin, Super Admin) |
| `Hospital` | Hospital/clinic details |
| `Doctor` | Doctor profiles linked to a User and Hospital |
| `DoctorShift` | Shift configurations with token limits and working days |
| `DoctorLeave` | Leave dates per doctor/shift |
| `Appointment` | Bookings with token numbers, status, and payment |
| `Payment` | Razorpay payment records per appointment |
| `OTP` | OTP codes with expiry for phone authentication |

---

## 🌱 Seeding Data

Populate the database with demo hospitals, doctors, and patient accounts:

```bash
cd backend
npm run prisma:seed
```

This creates the following test accounts (OTP will be logged to the console in development):

| Role | Phone | Details |
|------|-------|---------|
| Super Admin | `9000000001` | Full system access |
| Hospital Admin | `9000000002` | Manages City General Hospital |
| Doctor | `9000000003` | Cardiology — 70 tokens/day |
| Doctor | `9000000004` | Pediatrics — 50 tokens/day |
| Doctor | `9000000005` | Dermatology — 60 tokens/day |
| Patient | `9000000100` | Sample patient account |

---

## ▶️ Running the Application

### Development Mode

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

### Production Build

**Backend:**

```bash
cd backend
npm run build       # Compiles TypeScript to dist/
npm run start       # Runs compiled output
```

**Frontend:**

```bash
cd frontend
npm run build       # Outputs to dist/
npm run preview     # Preview the production build locally
```

### Useful Commands

```bash
# Backend
npm run prisma:studio    # Visual database browser at http://localhost:5555
npm run prisma:generate  # Regenerate Prisma client after schema changes

# Frontend
npm run lint             # ESLint checks
```

---

## 📖 API Documentation

Base URL (development): `http://localhost:5000`

All protected routes require the `Authorization: Bearer <token>` header.

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/send-otp` | Send OTP to phone number | No |
| `POST` | `/auth/verify-otp` | Verify OTP and receive JWT | No |
| `GET` | `/auth/me` | Get current authenticated user | Yes |

**Send OTP request:**
```json
{ "phone": "9000000100" }
```

**Verify OTP request:**
```json
{ "phone": "9000000100", "otp": "123456" }
```

---

### 🧑‍⚕️ Patient Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/patient/hospitals` | List all active hospitals |
| `GET` | `/patient/hospitals/:id/doctors` | Get doctors for a hospital |
| `GET` | `/patient/doctors/:id/availability?date=YYYY-MM-DD` | Check slot availability |
| `POST` | `/patient/appointments/book` | Book an appointment |
| `GET` | `/patient/appointments/my` | Get my appointment history |
| `GET` | `/patient/appointments/:id/status` | Get appointment status |

**Book appointment request:**
```json
{
  "doctorId": 1,
  "hospitalId": 1,
  "shiftId": 1,
  "appointmentDate": "2026-03-15"
}
```

---

### 🏥 Hospital Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/hospital-admin/doctors` | Create a doctor account |
| `GET` | `/hospital-admin/doctors` | List hospital doctors |
| `PUT` | `/hospital-admin/doctors/:id` | Update doctor details |
| `GET` | `/hospital-admin/appointments/today` | View today's full queue |
| `POST` | `/hospital-admin/appointments/:id/call-next` | Call the next patient |
| `POST` | `/hospital-admin/appointments/:id/skip` | Skip an appointment |
| `POST` | `/hospital-admin/appointments/:id/complete` | Mark appointment as complete |
| `GET` | `/hospital-admin/export/csv` | Export daily appointments as CSV |

---

### 👨‍⚕️ Doctor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/doctor/today-queue` | View today's patient queue |
| `POST` | `/doctor/appointments/:id/complete` | Mark consultation complete |

---

### 💳 Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payments/create-order` | Create a Razorpay payment order |
| `POST` | `/payments/webhook` | Handle Razorpay payment webhook |
| `GET` | `/payments/appointment/:id` | Get payment status for an appointment |

---

### 🔑 Super Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/super-admin/hospitals` | Create a new hospital |
| `GET` | `/super-admin/hospitals` | List all hospitals |
| `PUT` | `/super-admin/hospitals/:id/status` | Activate/deactivate a hospital |
| `POST` | `/super-admin/hospital-admins` | Create a hospital admin account |

---

### ❤️ Health Check

```
GET /health
→ { "status": "ok", "timestamp": "..." }
```

---

## 👥 User Roles

### 🔵 Patient
- Register/login with phone OTP
- Browse hospitals and available doctors
- Check real-time slot availability
- Book and pay for appointments
- View appointment history and queue status

### 🟢 Doctor
- View today's patient queue (per shift)
- See the currently called patient highlighted
- Mark consultations as complete
- Auto-advances queue to next patient

### 🟠 Hospital Admin
- Manage all doctors in the hospital
- Control the daily queue (Call Next / Skip / Complete)
- View real-time queue statistics
- Export daily appointment reports as CSV
- Configure doctor shifts and fees

### 🔴 Super Admin
- Create and manage hospitals/clinics
- Activate or deactivate hospitals
- Create hospital admin accounts
- Full system oversight

---

## 🔍 Features Explained

### Token Queue System

Tokens are assigned sequentially per doctor, per shift, per day. A database transaction ensures concurrency safety so two patients cannot receive the same token simultaneously:

```typescript
await prisma.$transaction(async (tx) => {
  const existing = await tx.appointment.count({
    where: { doctorId, shiftId, appointmentDate, status: { not: 'CANCELLED' } }
  });

  if (existing >= shift.tokenLimit) {
    throw new Error('No slots available for this shift');
  }

  return await tx.appointment.create({
    data: { patientId, doctorId, hospitalId, shiftId, appointmentDate, tokenNumber: existing + 1 }
  });
});
```

### Appointment Scheduling

- Patients select a hospital → doctor → shift → date
- System shows real-time remaining slot count
- Bookings up to 7 days ahead (configurable per hospital)
- Leave dates are automatically blocked

### Real-Time Queue Updates

- Admins and doctors poll the queue endpoint to get live status
- Appointment statuses: `PENDING` → `BOOKED` → `CALLED` → `COMPLETED` / `SKIPPED` / `CANCELLED`
- Auto-shift logic moves unviewed past appointments to today (runs on server startup and every hour)

### Payment Flow (Razorpay)

1. Patient books → appointment status: `PENDING`, payment: `PENDING`
2. Patient clicks **Proceed to Payment**
3. Razorpay hosted checkout opens (UPI, cards, netbanking)
4. On success → appointment status: `BOOKED`, payment: `PAID`
5. Test card: `4111 1111 1111 1111` | any future date | any CVV

---

## 🚢 Deployment

### Frontend — Vercel

The frontend is deployed on Vercel. To deploy your own instance:

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/), set the **root directory** to `frontend`.
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Add the environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
5. Deploy.

### Backend — Railway / Render / Fly.io

1. Create a new service pointing to the `backend` directory.
2. Set all environment variables from `.env.example`.
3. Set the start command to `npm run start`.
4. Provision a PostgreSQL database and update `DATABASE_URL`.

---

## ⚙️ Configuration

All backend configuration is managed via environment variables in `backend/.env`. Copy `backend/.env.example` as a starting point:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `DIRECT_URL` | — | — | Direct DB URL (Supabase/pooler setups) |
| `JWT_SECRET` | ✅ | — | Secret key for signing JWTs |
| `JWT_EXPIRY` | — | `7d` | JWT expiration duration |
| `PORT` | — | `5000` | Backend server port |
| `NODE_ENV` | — | `development` | `development` or `production` |
| `FRONTEND_URL` | — | `http://localhost:5173` | Allowed CORS origin |
| `FAST2SMS_API_KEY` | — | (dev key included) | Fast2SMS API key for OTP delivery |
| `RAZORPAY_KEY_ID` | — | (test key included) | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | — | (test key included) | Razorpay key secret |
| `REDIS_URL` | — | — | Upstash Redis URL (optional; falls back to in-memory) |
| `OTP_EXPIRY` | — | `300` | OTP validity in seconds |
| `WEBHOOK_SECRET` | — | — | Razorpay webhook signing secret |

> ⚠️ **Security:** Never commit your `.env` file. Always use strong, unique values for `JWT_SECRET` and API keys in production.

### Production Checklist

- [ ] Set a strong `JWT_SECRET`
- [ ] Replace development API keys with production keys
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` to your deployed frontend domain
- [ ] Enable HTTPS on your backend host
- [ ] Set up PostgreSQL backups
- [ ] Configure Redis for production rate limiting
- [ ] Add error monitoring (e.g., Sentry)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** — follow the existing code style (TypeScript, Prettier, ESLint).

3. **Test your changes** thoroughly.

4. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add doctor leave calendar view"
   ```

5. **Push** and open a **Pull Request** against `main`.

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation change |
| `refactor:` | Code refactor |
| `chore:` | Build/config changes |

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](./LICENSE) file for details.

---

## 🆘 Support & Contact

- 🐛 **Bug Reports & Feature Requests** — [Open an issue](https://github.com/KUNALM17/Token/issues)
- 💬 **Discussions** — [GitHub Discussions](https://github.com/KUNALM17/Token/discussions)
- 🌐 **Live Demo** — [https://token-sooty-tau.vercel.app](https://token-sooty-tau.vercel.app)

---

<p align="center">Built with ❤️ for better healthcare management</p>

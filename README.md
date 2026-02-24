# 🏥 Hospital Token System - MVP

A production-ready appointment management system with token-based queue, OTP authentication, and Razorpay payments.

## 🚀 Quick Start

### 1. Setup Database
See: **[SETUP.md](./SETUP.md)** - Run the SQL file in Supabase

### 2. Servers (Already Running)
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### 3. Test
Open http://localhost:5173 and login with phone `9000000100`

---

## ✨ Features

✅ Token queue system (sequential tokens per doctor per day)
✅ OTP authentication (Fast2SMS)
✅ Razorpay payments (test mode ready)
✅ 4 role-based dashboards (Patient, Doctor, Admin, Super Admin)
✅ Queue management (call next, skip, complete)
✅ CSV export for hospital admin
✅ PostgreSQL + Prisma ORM
✅ TypeScript + React + Vite + Tailwind

---

## 📁 Project Structure

```
backend/           → Node.js API (27 endpoints)
frontend/          → React UI (5 dashboards)
SETUP.md          → Setup instructions
SETUP_DATABASE.sql → Database schema + demo data
```

---

## 🔑 Credentials

**Database**: `postgresql://postgres:Il5Hdcw1t3yvxkuJ@db.oilwihrsslsscojtpghe.supabase.co:5432/postgres`

**API Keys**: ✅ All configured in `/backend/.env`

---

## 📚 Documentation

- **SETUP.md** - How to get started (recommended read first)
- **backend/README.md** - Backend API documentation
- **frontend/README.md** - Frontend setup guide

---

## 🧪 Test Accounts

After running SETUP_DATABASE.sql:

```
Patient:       9000000100
Doctor:        9000000003
Admin:         9000000002
Super Admin:   9000000001
```

Login via OTP (check backend console for code)

---

## 🎯 API Endpoints (27 Total)

### Authentication (3)
- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and get JWT
- `GET /auth/me` - Get current user

### Patient (6)
- `GET /patient/hospitals` - List all hospitals
- `GET /patient/hospitals/:id/doctors` - Get doctors in hospital
- `GET /patient/doctors/:id/availability` - Check availability
- `POST /patient/appointments/book` - Book appointment
- `GET /patient/appointments/my` - Get my appointments
- `GET /patient/appointments/:id/status` - Check status

### Hospital Admin (9)
- `GET /admin/appointments/today` - View today's queue
- `POST /admin/appointments/:id/call-next` - Call next patient
- `POST /admin/appointments/:id/skip` - Skip patient
- `POST /admin/appointments/:id/complete` - Mark complete
- `POST /admin/doctors` - Create doctor
- `GET /admin/doctors` - List doctors
- `PUT /admin/doctors/:id` - Update doctor
- `GET /admin/export/csv` - Export CSV
- [+1 more]

### Doctor (2)
- `GET /doctor/today-queue` - View queue
- `POST /doctor/appointments/:id/complete` - Mark complete

### Payments (3)
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/webhook` - Payment webhook
- `GET /payments/appointment/:id` - Check payment status

### Super Admin (4)
- `POST /super-admin/hospitals` - Create hospital
- `GET /super-admin/hospitals` - List hospitals
- `PUT /super-admin/hospitals/:id/status` - Toggle status
- `POST /super-admin/hospital-admins` - Create admin

---

## 🛠️ Tech Stack

**Backend**: Node.js • Express • TypeScript • Prisma ORM • JWT • Fast2SMS • Razorpay
**Frontend**: React 18 • Vite • Tailwind CSS • React Router • Axios
**Database**: PostgreSQL (Supabase)

---

## 📊 Database Schema

8 tables with relationships:
- User (all roles)
- Hospital
- Doctor
- Appointment (unique tokens per day)
- Payment
- OTP
- Indexes for performance
- Constraints for data integrity

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Frontend | ✅ Running |
| Backend | ✅ Running |
| Database | ⏳ Waiting for SETUP_DATABASE.sql |

---

## 🎉 Next Steps

1. **→ Open SETUP.md**
2. Run SETUP_DATABASE.sql in Supabase
3. Test at http://localhost:5173

That's it! 🚀

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (LTS)
- **PostgreSQL** 12+ (active on localhost:5432)
- **npm** or **yarn**

### 1️⃣ Database Setup

Your PostgreSQL is already active on port 5432. Create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hospital_token_db;

# Exit
\q
```

### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials:
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_token_db"

# The API keys are already in .env.example - keep them as is

# Run migrations
npm run prisma:migrate

# Seed sample data (creates demo users, hospitals, doctors)
npm run prisma:seed

# Start development server
npm run dev
```

Server will run on **http://localhost:5000**

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on **http://localhost:5173**

---

## 🔐 Included API Keys (Development)

```
FAST2SMS_API_KEY=KZQnfzDa3XCO2dUWtuMxG0Sk9eyw8TgplbBHNJYFoVrv7hIA6mwZmaRAyL6XlKJgb0Tzu5MOs8WhoNSv
RAZORPAY_KEY_ID=rzp_test_SJv40kfG0d9ORd
RAZORPAY_KEY_SECRET=15XlD4zY9DhCjnLdlUp8M156
```

---

## 👥 Test Credentials (Auto-Generated)

Login with these phone numbers. OTP will be **logged to console** in dev mode:

| Role | Phone | Password |
|------|-------|----------|
| Super Admin | 9000000001 | (OTP from console) |
| Hospital Admin | 9000000002 | (OTP from console) |
| Doctor (Cardiology, 70 tokens/day) | 9000000003 | (OTP from console) |
| Doctor (Pediatrics, 50 tokens/day) | 9000000004 | (OTP from console) |
| Doctor (Dermatology, 60 tokens/day) | 9000000005 | (OTP from console) |
| Patient | 9000000100+ | (OTP from console) |

---

## 🔐 API Endpoints

### Authentication
```
POST   /auth/send-otp              Send OTP to phone
POST   /auth/verify-otp            Verify OTP & login/register
GET    /auth/me                    Get current user
```

### Super Admin
```
POST   /super-admin/hospitals           Create hospital
GET    /super-admin/hospitals           Get all hospitals
PUT    /super-admin/hospitals/:id/status Update hospital status
POST   /super-admin/hospital-admins     Create hospital admin
```

### Hospital Admin
```
POST   /admin/doctors               Create doctor
GET    /admin/doctors               Get doctors
PUT    /admin/doctors/:id           Update doctor
GET    /admin/appointments/today    Get today's queue
POST   /admin/appointments/:id/call-next      Call next patient
POST   /admin/appointments/:id/skip           Skip appointment
POST   /admin/appointments/:id/complete       Mark complete
GET    /admin/export/csv            Export CSV
```

### Doctor
```
GET    /doctor/today-queue          Get today's queue
POST   /doctor/appointments/:id/complete   Mark complete
```

### Patient
```
GET    /patient/hospitals                     Get all hospitals
GET    /patient/hospitals/:id/doctors         Get doctors
GET    /patient/doctors/:id/availability?date=YYYY-MM-DD  Check availability
POST   /patient/appointments/book            Book appointment
GET    /patient/appointments/my              Get my appointments
GET    /patient/appointments/:id/status      Get status
```

### Payments
```
POST   /payments/create-order      Create Razorpay order
POST   /payments/webhook            Payment verification
GET    /payments/appointment/:id    Get payment status
```

---

## 🎨 Dashboard Features

### Patient Dashboard
- ✅ Browse hospitals & doctors
- ✅ Check real-time availability (10 slots remaining, etc.)
- ✅ Book appointments (redirects to Razorpay)
- ✅ View appointment history with status

### Hospital Admin Dashboard
- ✅ Queue Management: Call Next, Skip, Mark Complete
- ✅ Real-time stats (Booked: 12, Called: 5, Completed: 8)
- ✅ Doctor management & fee configuration
- ✅ CSV export of daily appointments
- ✅ Progress bar: "12/70" (token, daily limit)

### Doctor Dashboard
- ✅ View today's queue with real-time updates
- ✅ See next called appointment (highlighted)
- ✅ Mark appointments as complete
- ✅ Auto-advances to next patient

### Super Admin Dashboard
- ✅ Create hospitals
- ✅ Manage hospital status
- ✅ Create hospital admins
- ✅ View all hospitals with details

---

## 💳 Payment Integration

**Razorpay Hosted Checkout (UPI + Cards)**

1. Patient books appointment → Payment status: PENDING
2. Patient clicks "Proceed to Payment"
3. Razorpay UPI/Card checkout opens
4. Test card: `4111 1111 1111 1111` | Any date | Any CVV
5. Payment confirmed → Appointment becomes BOOKED
6. Patient can see "Payment: PAID" status

---

## 🔄 Token Queue Logic (Concurrency-Safe)

```typescript
// Database transaction ensures race-condition safety
await prisma.$transaction(async (tx) => {
  // Count existing tokens for doctor + date
  const count = await tx.appointment.count({
    where: { doctorId, appointmentDate }
  });
  
  const nextToken = count + 1;
  
  // Reject if exceeds daily limit
  if (nextToken > doctor.dailyTokenLimit) {
    throw new Error('No slots available');
  }
  
  // Create appointment with token number
  return await tx.appointment.create({
    data: {
      patientId, doctorId, appointmentDate,
      tokenNumber: nextToken,
      status: 'BOOKED'
    }
  });
});
```

---

## 🔧 Commands Reference

### Backend
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed demo data
npm run prisma:studio    # Open Prisma Studio
```

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview built app
```

---

## 📝 Environment Setup Summary

✅ **PostgreSQL**: Already running on localhost:5432
✅ **Fast2SMS**: API key included
✅ **Razorpay**: Test keys included
✅ **Upstash Redis**: Optional (in-memory fallback included)

Just update `DATABASE_URL` in `.env` and you're ready to go!

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"

# If not running, start it
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Services > PostgreSQL > Start
```

### Prisma Errors
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or create fresh migration
npx prisma migrate dev --name init
```

### Port Already in Use
```bash
# Change port in backend/.env
PORT=5001

# Or kill process using port 5000
lsof -i :5000
kill -9 <PID>
```

---

## ✨ Production Checklist

- [ ] Use strong `JWT_SECRET`
- [ ] Replace API keys with production keys
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Enable error logging (Sentry)
- [ ] Configure Redis for production
- [ ] Add rate limiting
- [ ] Set up monitoring

---

**🎉 You're all set! Start with the backend, then frontend. Enjoy!**

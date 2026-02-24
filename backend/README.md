# Hospital Token System - Backend Setup

## Prerequisites
- Node.js (v18 or later)
- PostgreSQL (running on localhost:5432)
- npm or yarn

## Installation

```bash
cd backend
npm install
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hospital_token_db;

# Exit psql
\q
```

### 2. Configure Environment Variables

```bash
# Copy example env
cp .env.example .env

# Edit .env and update DATABASE_URL
# DATABASE_URL="postgresql://user:password@localhost:5432/hospital_token_db"
```

### 3. Run Migrations

```bash
npm run prisma:migrate
```

### 4. Seed Data

```bash
npm run prisma:seed
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and login/register
- `GET /auth/me` - Get current user

### Super Admin
- `POST /super-admin/hospitals` - Create hospital
- `GET /super-admin/hospitals` - Get all hospitals
- `PUT /super-admin/hospitals/:id/status` - Update hospital status
- `POST /super-admin/hospital-admins` - Create hospital admin

### Hospital Admin
- `POST /admin/doctors` - Create doctor
- `GET /admin/doctors` - Get doctors
- `PUT /admin/doctors/:id` - Update doctor
- `GET /admin/appointments/today` - Get today's appointments
- `POST /admin/appointments/:id/call-next` - Call next appointment
- `POST /admin/appointments/:id/skip` - Skip appointment
- `POST /admin/appointments/:id/complete` - Complete appointment
- `GET /admin/export/csv` - Export appointments as CSV

### Doctor
- `GET /doctor/today-queue` - Get today's queue
- `POST /doctor/appointments/:id/complete` - Complete appointment

### Patient
- `GET /patient/hospitals` - Get all hospitals
- `GET /patient/hospitals/:id/doctors` - Get doctors for hospital
- `GET /patient/doctors/:id/availability?date=YYYY-MM-DD` - Check availability
- `POST /patient/appointments/book` - Book appointment
- `GET /patient/appointments/my` - Get my appointments
- `GET /patient/appointments/:id/status` - Get appointment status

### Payments
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/webhook` - Payment webhook verification
- `GET /payments/appointment/:appointmentId` - Get payment details

## Testing

Use Postman or curl to test the APIs.

### Test OTP Flow
1. Send OTP: `POST /auth/send-otp` with `{"phone": "9000000001"}`
2. OTP is logged to console (development mode)
3. Verify: `POST /auth/verify-otp` with OTP

### Test Appointment Booking
1. Get hospitals: `GET /patient/hospitals`
2. Get doctors: `GET /patient/hospitals/{hospitalId}/doctors`
3. Check availability: `GET /patient/doctors/{doctorId}/availability?date=2024-02-24`
4. Book: `POST /patient/appointments/book` with doctor and date
5. Create payment order: `POST /payments/create-order`
6. Complete payment in Razorpay
7. Webhook updates appointment status

## Notes

- OTP expires in 5 minutes (configurable via `OTP_EXPIRY`)
- Tokens are sequential per doctor per day
- Token limit is enforced at database level with transactions
- Use Razorpay test keys for development
- Redis/Upstash is optional - in-memory fallback included

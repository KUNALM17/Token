# ⚡ Quick Reference Guide

## 🚀 Start Here (3 Commands)

```bash
# Terminal 1: Backend
cd backend && npm install && npm run prisma:migrate && npm run prisma:seed && npm run dev

# Terminal 2: Frontend  
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173

---

## 🔓 Quick Login

| User | Phone | Password |
|------|-------|----------|
| Patient | 9000000100 | OTP from backend console |
| Doctor | 9000000003 | OTP from backend console |
| Admin | 9000000002 | OTP from backend console |
| Super Admin | 9000000001 | OTP from backend console |

---

## 📍 Ports

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432

---

## 🔧 Useful Commands

```bash
# Backend
npm run dev              # Start server
npm run prisma:seed     # Add test data
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open DB GUI

# Frontend
npm run dev             # Start dev server
npm run build           # Create production build
```

---

## 📁 Key Files

### Backend
- `src/index.ts` - Server & routes setup
- `src/routes/*.ts` - All API endpoints
- `src/services/` - Business logic (SMS, JWT, Payment)
- `prisma/schema.prisma` - Database schema

### Frontend
- `src/App.tsx` - Routing & auth
- `src/pages/` - Dashboards for each role
- `src/api.ts` - API client

---

## 🧪 Test a Flow

### 1. Patient Books Appointment
1. Login as patient (9000000100)
2. Select hospital
3. Select doctor
4. Check availability (should show slots remaining)
5. Book appointment
6. "Proceed to Payment" opens Razorpay
7. Pay with test card: 4111 1111 1111 1111

### 2. Hospital Admin Manages Queue
1. Login as admin (9000000002)
2. Go to "Queue Management"
3. See appointments with tokens
4. Click "Call" → status changes to CALLED
5. Click "Done" → status changes to COMPLETED
6. Click "Export CSV" → download data

### 3. Doctor Views Queue
1. Login as doctor (9000000003)
2. See "Today's Queue"
3. Green banner shows who's next
4. Click "Mark Complete" when done

---

## 💻 API Examples

### Send OTP
```bash
curl -X POST http://localhost:5000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9000000100"}'
```

### Get Hospitals
```bash
curl http://localhost:5000/patient/hospitals
```

### Book Appointment
```bash
curl -X POST http://localhost:5000/patient/appointments/book \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doctor-uuid",
    "hospitalId": "hospital-uuid",
    "appointmentDate": "2024-02-24"
  }'
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Port 5000 in use | Change `PORT=5001` in .env |
| Database connection error | Check PostgreSQL is running |
| OTP not showing | Look in backend terminal |
| npm packages error | Delete node_modules, run `npm install` |

---

## 📊 Database

```bash
# Connect to database
psql -U postgres -d hospital_token_db

# View tables
\dt

# View users
SELECT * FROM "User";

# View appointments
SELECT * FROM "Appointment";

# Exit
\q
```

---

## 🎯 What to Test

✅ **OTP Login** - Works offline, shows OTP in console
✅ **Hospital Selection** - 1 hospital auto-created by seeding
✅ **Doctor Listing** - 3 demo doctors created
✅ **Token Queue** - Sequential, respects daily limit
✅ **Payment** - Test Razorpay keys included
✅ **Queue Management** - Call, skip, complete
✅ **CSV Export** - Downloads appointment data
✅ **Role-Based Access** - Each role sees only their dashboard

---

## 📞 API Endpoints (Quick List)

### Auth
- POST /auth/send-otp
- POST /auth/verify-otp
- GET /auth/me

### Patient
- GET /patient/hospitals
- GET /patient/hospitals/:id/doctors
- GET /patient/doctors/:id/availability
- POST /patient/appointments/book
- GET /patient/appointments/my

### Hospital Admin
- GET /admin/doctors
- POST /admin/doctors
- GET /admin/appointments/today
- POST /admin/appointments/:id/call-next
- POST /admin/appointments/:id/complete
- GET /admin/export/csv

### Doctor
- GET /doctor/today-queue
- POST /doctor/appointments/:id/complete

### Super Admin
- GET /super-admin/hospitals
- POST /super-admin/hospitals
- PUT /super-admin/hospitals/:id/status

### Payments
- POST /payments/create-order
- POST /payments/webhook

---

## 🔐 Included Credentials

All already in `.env.example`:

```
FAST2SMS_API_KEY=KZQnfzDa...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=15XlD4...
```

---

## 📝 Environment File

`backend/.env` needs only **one change**:

```env
# Change password to your PostgreSQL password
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hospital_token_db"
```

Everything else is already configured!

---

## ✨ Pro Tips

1. **OTP for testing**: Always check backend console after clicking "Send OTP"
2. **Token limits**: Each doctor has a daily limit (70, 50, 60 tokens)
3. **Payment test**: Use `4111 1111 1111 1111` as test card
4. **CSV export**: Click in Hospital Admin dashboard to download data
5. **Real-time updates**: Queue updates instantly when status changes

---

**Ready? Start the servers! 🚀**

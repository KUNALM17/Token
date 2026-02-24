# 🏥 Hospital Token System - CLEAN SETUP GUIDE

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Project Cleanup** | ✅ DONE | 30+ unnecessary files deleted |
| **Environment File** | ✅ DONE | `.env` created with all credentials |
| **Backend Dependencies** | ✅ DONE | 326 packages installed |
| **Frontend Dependencies** | ✅ DONE | 161 packages installed |
| **Prisma Client** | ✅ DONE | Generated from schema |
| **Database Connection** | ❌ PENDING | Supabase host not reachable |

---

## 📁 Clean Project Structure

```
Token/
├── README.md                          (Main documentation)
├── SETUP.md                          (Setup instructions)
├── SETUP_PROGRESS.md                 (Progress tracker - NEW)
├── SETUP_DATABASE.sql                (Database schema)
├── INSERT_DEMO_DATA.sql              (Demo test data)
│
├── backend/
│   ├── .env                          (Configuration - CREATED)
│   ├── .env.example                  (Template reference)
│   ├── package.json                  (Dependencies)
│   ├── tsconfig.json                 (TypeScript config)
│   ├── prisma/
│   │   └── schema.prisma             (Database schema definition)
│   └── src/
│       ├── index.ts                  (Express server)
│       ├── seed.ts                   (Database seeding)
│       ├── middleware/               (3 middleware files)
│       │   ├── auth.ts
│       │   ├── errorHandler.ts
│       │   └── validation.ts
│       ├── routes/                   (6 API route files)
│       │   ├── auth.routes.ts
│       │   ├── patient.routes.ts
│       │   ├── doctor.routes.ts
│       │   ├── hospitalAdmin.routes.ts
│       │   ├── superAdmin.routes.ts
│       │   └── payment.routes.ts
│       └── services/                 (4 service files)
│           ├── jwt.service.ts
│           ├── sms.service.ts
│           ├── payment.service.ts
│           └── redis.service.ts
│
└── frontend/
    ├── package.json                  (Dependencies)
    ├── tsconfig.json                 (TypeScript config)
    ├── vite.config.ts                (Vite build config)
    ├── tailwind.config.js            (Tailwind config)
    ├── postcss.config.js             (PostCSS config)
    └── src/
        ├── App.tsx                   (Main routing)
        ├── main.tsx                  (React entry point)
        ├── api.ts                    (Axios HTTP client)
        ├── types.ts                  (TypeScript interfaces)
        ├── index.css                 (Styling)
        └── pages/                    (5 role-based dashboards)
            ├── LoginPage.tsx
            ├── PatientDashboard.tsx
            ├── DoctorDashboard.tsx
            ├── HospitalAdminDashboard.tsx
            └── SuperAdminDashboard.tsx
```

---

## 🔧 Environment File (.env) - Created ✅

Located at: `/backend/.env`

```bash
# Database (Supabase) - NEEDS VERIFICATION
DATABASE_URL="postgresql://postgres:Il5Hdcw1t3yvxkuJ@db.oilwihrsslsscojtpghe.supabase.co:5432/postgres"

# JWT Token
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRY="7d"

# SMS Service (Fast2SMS)
FAST2SMS_API_KEY="KZQnfzDa3XCO2dUWtuMxG0Sk9eyw8TgplbBHNJYFoVrv7hIA6mwZmaRAyL6XlKJgb0Tzu5MOs8WhoNSv"

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID="rzp_test_SJv40kfG0d9ORd"
RAZORPAY_KEY_SECRET="15XlD4zY9DhCjnLdlUp8M156"

# Redis Cache (Upstash) - OPTIONAL
REDIS_URL="redis://default:password@host:port"

# Server Configuration
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# OTP Configuration
OTP_EXPIRY=300

# Webhook Configuration
WEBHOOK_SECRET="your-webhook-secret-key"
```

---

## 🚨 CRITICAL ISSUE: Database Connection

### Problem
```
⚠️  Cannot connect to Supabase
Error: P1001: Can't reach database server
Cause: Unknown host "db.oilwihrsslsscojtpghe.supabase.co"
```

### Reason
The Supabase hostname is not resolving. This could mean:
1. The credentials are outdated/incorrect
2. The Supabase project was deleted
3. Network connectivity issues
4. DNS resolution failure

---

## 🔴 IMMEDIATE ACTION REQUIRED

### To Fix Database Connection:

**Step 1: Verify Supabase Project**
```bash
# Open in browser
https://app.supabase.com
```

**Step 2: Check Project Status**
- Login to your account
- Look for your project in the dashboard
- If it exists, click on it
- If it doesn't exist, you need to create a new one

**Step 3: Get Correct Database Credentials**
```
In Supabase Dashboard:
1. Click on your project
2. Go to Settings (gear icon)
3. Click "Database"
4. Copy the connection string
```

**Step 4: Update .env File**
```bash
# Get these values from Supabase:
- Host: db.xxxxx.supabase.co
- Port: 5432
- Database: postgres
- User: postgres
- Password: [your-password]

# Then update DATABASE_URL in /backend/.env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**Step 5: Test Connection**
```bash
cd /Users/kunalmani/Token1/Token/backend
npx prisma db push --skip-generate
```

---

## ✅ Once Database is Fixed

### Step 1: Push Schema to Database
```bash
cd /Users/kunalmani/Token1/Token/backend
npm run prisma:generate
npx prisma db push
```

### Step 2: Seed Demo Data
```bash
npm run prisma:seed
```

This creates:
- 1 Hospital
- 1 Super Admin (phone: 9000000001)
- 1 Hospital Admin (phone: 9000000002)
- 2 Doctors (phone: 9000000003, 9000000004)
- 5 Patients (phone: 9000000100-9000000104)

### Step 3: Start Backend Server
```bash
npm run dev
```

Expected output:
```
✓ Database connected
✓ Server running on http://localhost:5000
```

### Step 4: Start Frontend Server (in another terminal)
```bash
cd /Users/kunalmani/Token1/Token/frontend
npm run dev
```

Expected output:
```
VITE v5.0.8 ready in 226 ms
➜ Local: http://localhost:5173/
```

### Step 5: Test Application
1. Open http://localhost:5173
2. Enter phone: `9000000100`
3. Click "Send OTP"
4. Check backend console for OTP code
5. Enter OTP to login

---

## 🎯 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│                    http://localhost:5173                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes:                                              │   │
│  │  / → Login Page                                      │   │
│  │  /patient → Patient Dashboard                        │   │
│  │  /doctor → Doctor Dashboard                          │   │
│  │  /admin → Hospital Admin Dashboard                   │   │
│  │  /super-admin → Super Admin Dashboard                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTP (Axios)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)               │
│                    http://localhost:5000                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes:                                              │   │
│  │  /auth → OTP login, verify, get user                 │   │
│  │  /patient → Appointments, hospitals, doctors         │   │
│  │  /doctor → Queue, patients                           │   │
│  │  /admin → Manage doctors, queue, export CSV          │   │
│  │  /super-admin → Create hospitals, view all           │   │
│  │  /payments → Razorpay integration                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────────────┘
                     │ SQL (Prisma)
         ┌───────────┼───────────┬────────────┐
         ▼           ▼           ▼            ▼
    ┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
    │PostgreSQL│ │ Fast2SMS│ │Razorpay │ │Redis     │
    │(Supabase)│ │(OTP)   │ │(Payment) │ │(Cache)   │
    └─────────┘ └────────┘ └──────────┘ └──────────┘
```

---

## 📋 Checklist

- [x] Project cleanup completed (30+ files deleted)
- [x] Backend dependencies installed (326 packages)
- [x] Frontend dependencies installed (161 packages)
- [x] Environment file created (.env)
- [x] Prisma client generated
- [ ] Database connection verified
- [ ] Database schema pushed to Supabase
- [ ] Demo data seeded
- [ ] Backend server tested
- [ ] Frontend server tested
- [ ] Application login tested

---

## 📞 Quick Commands Reference

```bash
# Backend
cd /Users/kunalmani/Token1/Token/backend
npm run dev              # Start development server
npm run build           # Build for production
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:seed     # Seed demo data

# Frontend
cd /Users/kunalmani/Token1/Token/frontend
npm run dev             # Start development server
npm run build           # Build for production

# Check status
npm list --depth=0      # List installed packages
```

---

## 🆘 Troubleshooting

**Q: Database connection fails**
A: Verify Supabase credentials in .env and test connectivity

**Q: OTP not sending**
A: Check Fast2SMS API key and network connectivity

**Q: Login page shows "CORS error"**
A: Ensure backend is running on port 5000

**Q: Build fails**
A: Delete node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 📌 Important Notes

⚠️ **Security**: Never commit `.env` file to git (already in .gitignore)

⚠️ **JWT Secret**: Change `JWT_SECRET` before deploying to production

⚠️ **API Keys**: All API keys are for testing. Replace with production keys when needed

---

**Last Updated**: 24 Feb 2026
**Status**: ✅ 80% Complete (Awaiting Database Connection)

# 🎬 Visual Setup Guide: PostgreSQL → Supabase

## Your Situation

```
Your Current Setup:
┌─────────────────────────────────────────┐
│  Hospital Token System                  │
│  ├─ Backend (Node.js) ✅ Running       │
│  ├─ Frontend (React) ✅ Running        │
│  └─ Database ❌ Missing (PostgreSQL)   │
└─────────────────────────────────────────┘

Your Goal:
┌─────────────────────────────────────────┐
│  Connected to Supabase PostgreSQL       │
│  ├─ Backend → :5000 ✅                 │
│  ├─ Frontend → :5173 ✅                │
│  └─ Database → Supabase Cloud ✅       │
└─────────────────────────────────────────┘
```

---

## 🎯 Path to Success

### Path 1: Recommended (Supabase Direct) - 5 min ⭐

```
START
  ↓
Create Supabase Account
  ↓
Create Project (2 min wait)
  ↓
Copy Connection URL
  ↓
nano backend/.env → Update DATABASE_URL
  ↓
cd backend && npm run prisma:migrate
  ↓
npm run prisma:seed
  ↓
npm run dev (backend)
  ↓
npm run dev (frontend)
  ↓
Open http://localhost:5173
  ↓
SUCCESS! ✅
```

### Path 2: Local First (Not Recommended) - 20 min

```
START
  ↓
apt-get install postgresql (might fail in container)
  ↓
createdb hospital_token_db
  ↓
Update .env for localhost
  ↓
npm run prisma:migrate
  ↓
... later, migrate to Supabase ...
  ↓
EXTRA WORK ❌
```

### Path 3: If You Already Have Local Data - Complex

```
START
  ↓
Dump local database
  ↓
Create Supabase
  ↓
Restore to Supabase
  ↓
Update .env
  ↓
Test connection
  ↓
Verify data
  ↓
SUCCESS! ✅
```

---

## 🎬 Step-by-Step Screenshots (Text Format)

### Step 1: Visit Supabase

```
Browser: https://supabase.com
┌────────────────────────────────────────┐
│ SUPABASE                                │
│ ┌──────────────────────────────────┐   │
│ │ Start your project               │   │
│ │ [Continue with Email/GitHub]     │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

### Step 2: Create Project

```
Supabase Dashboard
┌────────────────────────────────────────┐
│ New Project                              │
│ ┌──────────────────────────────────┐   │
│ │ Name: hospital-token-system      │   │
│ │ Password: [strong password!]     │   │
│ │ Region: [nearest region]         │   │
│ │ [Create new project]             │   │
│ └──────────────────────────────────┘   │
│                                         │
│ Status: Provisioning... ⏳ (2-3 min)   │
└────────────────────────────────────────┘
```

### Step 3: Get Connection String

```
Supabase Dashboard
Settings → Database
┌────────────────────────────────────────┐
│ Connection Strings                      │
│ ┌──────────────────────────────────┐   │
│ │ PostgreSQL:                      │   │
│ │ postgresql://postgres:[PASS]     │   │
│ │ @[PROJECT].supabase.co:5432/     │   │
│ │ postgres                         │   │
│ │ [Copy]                           │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

### Step 4: Update .env

```bash
Terminal:
$ nano /workspaces/Token/backend/.env

┌──────────────────────────────────────────────┐
│ File: backend/.env                           │
│ ──────────────────────────────────────────── │
│ DATABASE_URL="postgresql://postgres:PASS    │
│ @abc123.supabase.co:5432/postgres"          │
│ JWT_SECRET="..."                            │
│ RAZORPAY_KEY_ID="..."                       │
│ ...                                          │
│ ──────────────────────────────────────────── │
│ Ctrl+O → Enter → Ctrl+X (Save)              │
└──────────────────────────────────────────────┘
```

### Step 5: Create Tables

```bash
Terminal:
$ cd /workspaces/Token/backend
$ npm run prisma:migrate

┌──────────────────────────────────────────────┐
│ Prisma Migrate                               │
│ ✓ Connection successful                     │
│ ✓ Migrations prepared                       │
│ ✓ Tables created:                           │
│   - User                                     │
│   - Hospital                                 │
│   - Doctor                                   │
│   - Appointment                              │
│   - Payment                                  │
│   - OTP                                      │
│ ✓ Database ready                            │
└──────────────────────────────────────────────┘
```

### Step 6: Add Demo Data

```bash
Terminal:
$ npm run prisma:seed

┌──────────────────────────────────────────────┐
│ Seeding database                             │
│ ✓ Created hospital: City Care Hospital      │
│ ✓ Created 3 doctors:                        │
│   - Dr. Sharma (Cardiology)                 │
│   - Dr. Patel (Pediatrics)                  │
│   - Dr. Singh (Dermatology)                 │
│ ✓ Created 5 sample patients                 │
│ ✓ Created sample appointments               │
│ ✓ Seed completed successfully               │
└──────────────────────────────────────────────┘
```

### Step 7: Start Backend

```bash
Terminal 1:
$ cd /workspaces/Token/backend
$ npm run dev

┌──────────────────────────────────────────────┐
│ Starting server...                           │
│ ✓ Database connected                        │
│ ✓ Server running on http://localhost:5000   │
│ ✓ Ready for requests                        │
└──────────────────────────────────────────────┘
```

### Step 8: Start Frontend

```bash
Terminal 2:
$ cd /workspaces/Token/frontend
$ npm run dev

┌──────────────────────────────────────────────┐
│ Vite v5.4.21                                │
│ ✓ Ready in 226ms                            │
│ ✓ Local: http://localhost:5173/             │
│ ✓ Press h + enter for help                  │
└──────────────────────────────────────────────┘
```

### Step 9: Test Application

```
Browser: http://localhost:5173
┌────────────────────────────────────────┐
│ Hospital Token System                   │
│ ┌──────────────────────────────────┐   │
│ │ Enter Phone Number               │   │
│ │ [9000000100________________]      │   │
│ │                                  │   │
│ │ [Send OTP]                       │   │
│ └──────────────────────────────────┘   │
│                                         │
│ Backend Console:                        │
│ OTP Code: 123456                       │
│                                         │
│ Enter OTP:                              │
│ [123456________]                        │
│ [Verify]                                │
│                                         │
│ ✅ Logged in!                           │
│ Patient Dashboard ✨                    │
└────────────────────────────────────────┘
```

### Step 10: Verify in Supabase Dashboard

```
Supabase: Table Editor
┌────────────────────────────────────────┐
│ Tables                                   │
│ ├─ User                    [5 rows]     │
│ ├─ Hospital                [1 row]      │
│ ├─ Doctor                  [3 rows]     │
│ ├─ Appointment             [5 rows]     │
│ ├─ Payment                 [0 rows]     │
│ ├─ OTP                     [0 rows]     │
│ └─ ... more tables                     │
│                                         │
│ Click User table:                       │
│ ┌──────────────────────────────────┐   │
│ │ ID  │ Phone      │ Name  │ Role  │   │
│ ├─────┼────────────┼───────┼───────┤   │
│ │ 1   │ 9000000001 │ Admin │ SA    │   │
│ │ 2   │ 9000000100 │ John  │ PT    │   │
│ │ 3   │ 9000000002 │ Sarah │ HA    │   │
│ │ ... │ ...        │ ...   │ ...   │   │
│ └──────────────────────────────────┘   │
│                                         │
│ ✅ All tables present!                 │
└────────────────────────────────────────┘
```

---

## ⏱️ Timeline

```
Action                          Time    Cumulative
─────────────────────────────────────────────────
Create Supabase account         1 min   1 min
Create project                  2 min   3 min   ⏳ (automatic)
Copy connection string         30 sec   3.5 min
Edit .env file                 30 sec   4 min
Run prisma:migrate             1 min    5 min
Run prisma:seed               30 sec    5.5 min
Start backend                 10 sec    5.6 min
Start frontend                10 sec    5.7 min
─────────────────────────────────────────────────
TOTAL TIME:                    ~6 min
```

---

## 🎯 Key Points

### What to Copy from Supabase
```
PostgreSQL Connection String looks like:
postgresql://postgres:PASSWORD@HOST.supabase.co:5432/postgres

Parts:
├─ postgres = username (always "postgres")
├─ PASSWORD = your database password
├─ HOST = project-code.supabase.co (without https)
└─ postgres = database name (always "postgres")
```

### What to Change in .env
```diff
- DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_token_db"
+ DATABASE_URL="postgresql://postgres:MyPassword@xyzabc123.supabase.co:5432/postgres"

              username  password      host              database
```

### What NOT to Change
```
JWT_SECRET          (keep it)
RAZORPAY_KEY_ID     (keep it)
RAZORPAY_SECRET     (keep it)
FAST2SMS_API_KEY    (keep it)
```

---

## ✅ Success Checklist

```
□ Supabase account created
□ Project created and initialized (2-3 min wait)
□ PostgreSQL connection string copied
□ backend/.env updated (line 1 only)
□ npm run prisma:migrate successful
□ npm run prisma:seed successful
□ Tables visible in Supabase dashboard
□ Backend starts without "Cannot connect" error
□ Frontend loads on http://localhost:5173
□ Can login with phone 9000000100
□ OTP appears in backend console
□ Dashboard loads after OTP verification
```

When all checkboxes are marked: ✅ **DONE!**

---

## 🚀 Next: Production Deployment

After testing locally with Supabase:

1. **Deploy Backend** (same app, different host)
2. **Deploy Frontend** (same app, different host)
3. **Keep Supabase** (no changes needed!)

All environments use the same Supabase database.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for details.

---

**Ready?** Open **[SUPABASE_QUICK.md](./SUPABASE_QUICK.md)** and follow the 5 steps! 🎉

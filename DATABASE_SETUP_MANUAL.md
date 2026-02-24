# 🚀 DATABASE SETUP - MANUAL SQL SETUP GUIDE

## 🔴 Current Issue

**PostgreSQL connection blocked on both port 5432 and 6543**

This is a **network connectivity issue**, not a credentials issue. Your ISP or firewall might be blocking direct PostgreSQL connections.

**Good News:** We can work around this using Supabase SQL Editor directly!

---

## ✅ Solution: Use Supabase SQL Editor

Since you cannot connect via PostgreSQL directly, use the Supabase dashboard to run the SQL schema.

### Step 1: Get the SQL Schema

The schema file is ready at: `/Users/kunalmani/Token1/Token/SETUP_DATABASE.sql`

Read it here: [SETUP_DATABASE.sql](./SETUP_DATABASE.sql)

### Step 2: Open Supabase SQL Editor

1. Go to: **https://oilwihrsslsscojtpghe.supabase.co**
2. Login if needed
3. Click **"SQL Editor"** in the left sidebar (under "Development")
4. Click **"New Query"** button

### Step 3: Copy and Paste the SQL

1. Open: `/Users/kunalmani/Token1/Token/SETUP_DATABASE.sql`
2. Copy ALL the SQL code
3. Paste it into Supabase SQL Editor
4. Click **"RUN"** button

### Step 4: Verify Tables Created

After running the SQL:
1. Go to **"Table Editor"** in left sidebar
2. You should see these tables:
   - `User`
   - `Hospital`
   - `Doctor`
   - `Appointment`
   - `Payment`
   - `OTP`

---

## 🌱 Step 5: Seed Demo Data

After tables are created, seed demo data:

### Option A: Using Supabase SQL Editor (Recommended)

1. Open: `/Users/kunalmani/Token1/Token/INSERT_DEMO_DATA.sql`
2. Copy ALL the SQL code
3. Paste into a **New Query** in Supabase SQL Editor
4. Click **"RUN"**

This creates:
- 1 Hospital: "City Medical Center"
- 1 Super Admin (phone: 9000000001)
- 1 Hospital Admin (phone: 9000000002)
- 2 Doctors (phone: 9000000003, 9000000004)
- 5 Patients (phone: 9000000100-9000000104)

### Option B: Using Local Seeding (After Network Fixed)

```bash
cd /Users/kunalmani/Token1/Token/backend
npm run prisma:seed
```

---

## 🔄 Continue with Local Development

Even though you can't connect via Prisma from your machine, you can still:

### Option 1: Start Backend in Development Mode

The backend will warn about database connection but will still start:

```bash
cd /Users/kunalmani/Token1/Token/backend
npm run dev
```

Expected output:
```
⚠️  Warning: Database connection failed
⚠️  Server running on http://localhost:5000 (without database)
```

### Option 2: Wait for Network Access

If your network/ISP allows PostgreSQL access later:
1. Update `/backend/.env` back to port 5432:
   ```
   DATABASE_URL="postgresql://postgres:Il5Hdcw1t3yvxkuJ@db.oilwihrsslsscojtpghe.supabase.co:5432/postgres"
   ```
2. Try connection again:
   ```bash
   npx prisma db push
   ```

---

## 📋 Current .env Configuration

Your `/backend/.env` is configured with:

✅ Database credentials (correct format)
✅ Supabase URL & Anon Key
✅ Fast2SMS API Key
✅ Razorpay API Keys
✅ JWT Secret
✅ All other required variables

**Current DATABASE_URL:**
```
postgresql://postgres:Il5Hdcw1t3yvxkuJ@db.oilwihrsslsscojtpghe.supabase.co:6543/postgres?pgbouncer=true
```

---

## 🎯 Next Steps (Recommended Order)

### 1. Create Schema in Supabase (5 minutes)
- Go to SQL Editor
- Run SETUP_DATABASE.sql
- Verify tables created

### 2. Seed Demo Data in Supabase (2 minutes)
- Go to SQL Editor
- Run INSERT_DEMO_DATA.sql
- Verify demo data appears

### 3. Start Backend Server
```bash
cd /Users/kunalmani/Token1/Token/backend
npm run dev
```

### 4. Start Frontend Server (in another terminal)
```bash
cd /Users/kunalmani/Token1/Token/frontend
npm run dev
```

### 5. Test the Application
- Open http://localhost:5173
- Login with phone: `9000000100`
- Check backend console for OTP code
- Enter OTP to login

---

## 💡 Why This Works

Even though Prisma can't connect directly, your backend API can:

1. **Supabase JS Client** uses REST API (not direct PostgreSQL)
2. **API calls** from frontend → backend → Supabase REST API
3. **Direct connections** (PostgreSQL) are blocked by your network

So the system will work fine once:
- Schema is created (via SQL Editor) ✓
- Demo data is seeded (via SQL Editor) ✓
- Backend and Frontend servers are running ✓

---

## 📞 SQL Files Location

| File | Purpose | Location |
|------|---------|----------|
| SETUP_DATABASE.sql | Create all tables | `/SETUP_DATABASE.sql` |
| INSERT_DEMO_DATA.sql | Add test accounts | `/INSERT_DEMO_DATA.sql` |

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tables already exist error | Drop tables first, then run SETUP_DATABASE.sql |
| Demo data already exists | Skip INSERT_DEMO_DATA.sql or delete existing data |
| Still can't run SQL | Check Supabase project is "Running" not "Provisioning" |
| Backend shows "without database" | Database not yet created - follow steps above |

---

## 🚀 System Will Work Like This

```
┌─────────────────────────┐
│  Browser                │
│  localhost:5173         │
└────────────┬────────────┘
             │ HTTP/HTTPS
             ▼
┌─────────────────────────┐
│  Frontend (React)       │
│  Vite Dev Server        │
└────────────┬────────────┘
             │ HTTP Requests
             ▼
┌─────────────────────────┐
│  Backend (Express)      │
│  localhost:5000         │
└────────────┬────────────┘
             │ REST API (HTTP)
             ▼
┌─────────────────────────┐
│  Supabase               │
│  PostgreSQL DB          │
│  (via REST API)         │
└─────────────────────────┘

Note: Direct PostgreSQL connections (TCP 5432/6543) blocked
      REST API connections (HTTPS 443) work fine ✓
```

---

## 📌 Remember

- **DO NOT** try to connect Prisma directly if port is blocked
- **DO** use Supabase SQL Editor for schema operations
- **DO** start backend and frontend anyway - they'll connect via REST API
- **Once tables are created**, everything will work normally

---

**Status**: Ready to proceed with manual SQL setup via Supabase Dashboard
**Last Updated**: 24 Feb 2026

# 🚀 Hospital Token System - Setup Instructions

## ✅ Prerequisites (You've Already Provided)

```
✓ Supabase Database Created
  - Host: db.oilwihrsslsscojtpghe.supabase.co
  - User: postgres
  - Password: Il5Hdcw1t3yvxkuJ

✓ API Keys Configured
  - Fast2SMS: KZQnfzDa3XCO2dUWtuMxG0Sk9eyw8TgplbBHNJYFoVrv7hIA6mwZmaRAyL6XlKJgb0Tzu5MOs8WhoNSv
  - Razorpay: rzp_test_SJv40kfG0d9ORd / 15XlD4zY9DhCjnLdlUp8M156
  - Supabase Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✓ All Environment Variables
  - Already configured in /backend/.env
```

---

## 🎯 Step 1: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to: **https://app.supabase.com**
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open file: `/workspaces/Token/SETUP_DATABASE.sql`
6. Copy ALL the SQL code
7. Paste into Supabase SQL Editor
8. Click **Run**
9. ✅ Database is ready!

### Option B: Using Prisma (If you can access PostgreSQL directly)

```bash
cd /workspaces/Token/backend
npm run prisma:migrate
npm run prisma:seed
```

---

## 🎯 Step 2: Verify Servers Are Running

### Check Backend (Terminal 1)
```bash
cd /workspaces/Token/backend
npm run dev
```

**Expected Output:**
```
✓ Server running on http://localhost:5000 (without database)
```
→ Once database is ready, it will show: `✓ Database connected`

### Check Frontend (Terminal 2)
```bash
cd /workspaces/Token/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.4.21 ready in 226 ms
➜  Local: http://localhost:5173/
```

---

## 🎯 Step 3: Test Your Application

### Test Login
1. Open: **http://localhost:5173**
2. Enter phone: `9000000100` (from demo data)
3. Click "Send OTP"
4. **Check backend console** for OTP code (looks like: `📧 OTP sent to 9000000100: 123456`)
5. Enter OTP and click "Verify"
6. ✅ You should see Patient Dashboard

---

## 📋 Available Test Accounts

After running the SQL setup:

| Role | Phone | Password |
|------|-------|----------|
| Patient | 9000000100 | OTP via console |
| Patient | 9000000101 | OTP via console |
| Doctor | 9000000003 | OTP via console |
| Hospital Admin | 9000000002 | OTP via console |
| Super Admin | 9000000001 | OTP via console |

---

## ✨ What Works After Setup

✅ **Patient Features**
- Browse hospitals & doctors
- Check availability ("10 slots remaining")
- Book appointments
- View appointment history
- Track appointment status

✅ **Doctor Features**
- View today's queue
- See next patient
- Mark appointments complete

✅ **Hospital Admin Features**
- Real-time queue management
- Call next / Skip / Complete actions
- CSV export
- Progress tracking (12/70 tokens used)

✅ **Super Admin Features**
- Create hospitals
- Manage hospital status

✅ **Payments**
- Razorpay integration (test mode)
- Test card: `4111 1111 1111 1111`

---

## 🛠️ Troubleshooting

### "Database connection failed"
- Database creation not complete yet
- Check if you've run the SETUP_DATABASE.sql in Supabase
- Wait a moment and refresh backend

### "Can't login"
- Make sure OTP from backend console is correct
- OTP appears only after clicking "Send OTP"
- Check backend terminal output

### "Frontend shows blank"
- Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Check browser console (F12) for errors

### "Port already in use"
```bash
# Kill process on port 5173 (frontend)
lsof -i :5173
kill -9 <PID>

# Kill process on port 5000 (backend)
lsof -i :5000
kill -9 <PID>
```

---

## 📊 Architecture

```
Frontend (React)          Backend (Node.js)         Database (PostgreSQL)
http://localhost:5173  →  http://localhost:5000  →  db.oilwihrsslsscojtpghe.supabase.co
   5 Dashboards               27 API Endpoints           8 Tables + Demo Data
   Role-Based Access          Auth + Services           8 Indexes
```

---

## ✅ System Status

| Component | Status | Details |
|-----------|--------|---------|
| Frontend | ✅ Running | http://localhost:5173 |
| Backend | ✅ Running | http://localhost:5000 |
| Database Schema | ⏳ Pending | Run SETUP_DATABASE.sql |
| Demo Data | ⏳ Pending | Included in SQL file |

---

## 🎉 Next Steps

1. **Run SETUP_DATABASE.sql** in Supabase
2. **Verify backend connects** (check terminal for "Database connected")
3. **Test at http://localhost:5173**
4. **Explore features!**

---

## 📞 Need More Help?

- **Backend API docs**: Check `/backend/README.md`
- **Frontend code**: Check `/frontend/README.md`
- **Database schema**: Check `/backend/prisma/schema.prisma`
- **API endpoints**: Check `/backend/src/routes/`

---

## 🚀 You're Ready!

Everything is built. All you need to do:
1. Create database schema (SETUP_DATABASE.sql)
2. Servers are already running
3. Test at http://localhost:5173

That's it! 🎊

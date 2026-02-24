# 🚀 Local PostgreSQL → Supabase Migration Guide

## Overview

You have two options:

### Option A: Start Fresh with Supabase (Recommended ⭐)
- Clean database
- No migration issues
- Takes 5 minutes
- **Best for development**

### Option B: Migrate Existing Data
- Keep existing data
- More complex process
- For production-ready systems
- **Skip this if starting fresh**

---

## ✅ Option A: Fresh Start with Supabase

This is what we recommend! You get a clean database with demo data.

### Step 1: Create Supabase Account
```
Visit: https://supabase.com
Click: "Start your project"
Sign up with email or GitHub
Verify your email
```

### Step 2: Create New Project
```
Click: "New Project"
Name: hospital-token-system
Password: [Create strong password - save it!]
Region: [Choose your region]
Click: "Create new project"
⏳ Wait 2-3 minutes...
```

### Step 3: Get Database URL
1. Go to your project dashboard
2. Click: **Settings** (bottom left)
3. Click: **Database**
4. Under "Connection string", copy the PostgreSQL one:
   ```
   postgresql://postgres:[PASSWORD]@[HOST].supabase.co:5432/postgres
   ```

### Step 4: Update Backend .env

```bash
# Open the file
nano /workspaces/Token/backend/.env
```

**Replace the first line** with your Supabase URL:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres"
```

**Example:**
```
DATABASE_URL="postgresql://postgres:MySecurePass123@abc123def456.supabase.co:5432/postgres"
```

### Step 5: Create Database Tables

```bash
cd /workspaces/Token/backend

# Generate Prisma client
npm run prisma:generate

# Create all tables on Supabase
npm run prisma:migrate

# Add demo data
npm run prisma:seed
```

### Step 6: Verify in Supabase Dashboard

1. Go to https://app.supabase.com
2. Open your project
3. Click: **Table Editor** (left sidebar)
4. You should see these tables:
   - User
   - Hospital
   - Doctor
   - Appointment
   - Payment
   - OTP

✅ If you see all tables → Success!

### Step 7: Start Your Servers

```bash
# Terminal 1: Backend
cd /workspaces/Token/backend
npm run dev

# Terminal 2: Frontend  
cd /workspaces/Token/frontend
npm run dev
```

### Step 8: Test Everything

1. Open http://localhost:5173
2. Enter phone: **9000000100**
3. Click "Send OTP"
4. Check **backend console** for OTP code
5. Enter OTP and login
6. Enjoy! 🎉

---

## 🔄 Option B: Migrate Existing Local Data (Advanced)

Skip if you don't have existing data.

### Prerequisites
- Local PostgreSQL running with `hospital_token_db`
- Supabase project created

### Migration Steps

#### Step 1: Dump Local Database
```bash
# Export all data from local PostgreSQL
pg_dump -U postgres -d hospital_token_db -f /tmp/backup.sql
```

#### Step 2: Restore to Supabase
```bash
# Connect to Supabase and restore
psql -h YOUR_HOST.supabase.co -U postgres -d postgres -f /tmp/backup.sql
```

#### Step 3: Update .env
```bash
nano /workspaces/Token/backend/.env

# Change DATABASE_URL to Supabase
DATABASE_URL="postgresql://postgres:PASSWORD@HOST.supabase.co:5432/postgres"
```

#### Step 4: Verify Data
```bash
# Connect to Supabase
psql -h YOUR_HOST.supabase.co -U postgres -d postgres

# Check data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Hospital";
\q
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to database"
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check your DATABASE_URL
cat /workspaces/Token/backend/.env | head -1

# Verify format:
# ✅ postgresql://postgres:password@host.supabase.co:5432/postgres
# ❌ postgresql://postgres:password@localhost:5432/postgres
```

### Issue 2: "Password authentication failed"
```
Error: password authentication failed for user "postgres"
```

**Solution:**
1. Copy password again from Supabase
2. Check for special characters: `@`, `$`, `!`, `#`
3. If password has special chars, escape them:
   ```
   $ → %24
   @ → %40
   # → %23
   ! → %21
   ```

### Issue 3: "Permission denied for schema public"
```
Error: permission denied for schema "public"
```

**Solution:**
1. Go to Supabase dashboard
2. Click: **SQL Editor**
3. Click: **New Query**
4. Paste this:
   ```sql
   GRANT ALL ON SCHEMA public TO postgres;
   ```
5. Click: **Run**

### Issue 4: Prisma Migration Fails
```
Error: Unknown command or flag "@prisma/cli"
```

**Solution:**
```bash
# Reinstall dependencies
cd /workspaces/Token/backend
rm -rf node_modules
npm install

# Try again
npm run prisma:migrate
```

### Issue 5: Tables Already Exist
```
Error: the following migrations have not been applied
```

**Solution A (Keep existing data):**
```bash
# Skip existing migrations
npm run prisma:migrate -- --skip-generate
```

**Solution B (Reset and start fresh):**
```bash
# WARNING: This deletes all data!
npm run prisma:migrate reset
npm run prisma:seed
```

---

## ✅ Verification Checklist

After setup, verify everything:

- [ ] DATABASE_URL updated in `.env`
- [ ] `npm run prisma:generate` successful
- [ ] `npm run prisma:migrate` successful
- [ ] `npm run prisma:seed` successful
- [ ] Tables visible in Supabase dashboard
- [ ] Backend server starts without DB errors
- [ ] Frontend loads on http://localhost:5173
- [ ] Can login with phone 9000000100

---

## 🔒 Security Checklist

Before going to production:

- [ ] Database password is strong (16+ chars, mixed case, numbers, symbols)
- [ ] `.env` is in `.gitignore` (don't commit to git!)
- [ ] DATABASE_URL is never logged or exposed
- [ ] Use environment variables for all secrets
- [ ] Enable Supabase backups (automatic)
- [ ] Enable row-level security (RLS) for sensitive tables

---

## 📊 Database Backup & Recovery

### Automatic Backups (Supabase)
- ✅ Daily backups (free tier)
- ✅ 7-day retention
- ✅ One-click restore in dashboard

### Manual Backup (you)
```bash
# Export database
pg_dump -h HOST.supabase.co -U postgres -d postgres > backup.sql

# Restore from backup
psql -h HOST.supabase.co -U postgres -d postgres < backup.sql
```

---

## 🚀 After Successful Setup

### Test All Features
1. Login as Patient → Book appointment
2. Make payment (test card: 4111 1111 1111 1111)
3. Login as Doctor → View queue
4. Login as Hospital Admin → Manage doctors
5. Login as Super Admin → Create hospitals

### Deploy to Production
- **Backend**: Heroku, Railway, Render
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Database**: Supabase (already deployed!)

All will use the same Supabase database.

---

## 💬 Need More Help?

### Read These Docs
- **[README.md](./README.md)** - System overview
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production guide

### Check These Resources
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

## 🎯 Quick Commands Reference

```bash
# Supabase connection
psql -h PROJECT.supabase.co -U postgres -d postgres

# Prisma commands
npm run prisma:generate      # Generate client
npm run prisma:migrate       # Run migrations
npm run prisma:seed          # Add demo data
npm run prisma:studio        # Open data explorer
npm run prisma:migrate reset # Reset database

# Server commands
npm run dev                  # Start server

# View logs
npm run prisma:migrate       # Shows SQL being run
```

---

**Congratulations!** You now have a cloud-hosted database ready for production! 🎉

# 🚀 PostgreSQL to Supabase Migration Guide

## Why Supabase?
✅ Hosted PostgreSQL (no local setup needed)
✅ Free tier (500MB database)
✅ Real-time features built-in
✅ Auto-backup and recovery
✅ Easy to use dashboard
✅ Perfect for your Hospital Token System

---

## 📋 Step 1: Create Supabase Account & Project

### 1. Go to [https://supabase.com](https://supabase.com)
- Click "Start your project"
- Sign up with email or GitHub
- Verify email

### 2. Create New Project
- Click "New Project"
- **Project Name**: `hospital-token-system`
- **Database Password**: Create strong password (save this!)
- **Region**: Choose closest to you
- Click "Create new project"

⏳ Wait 2-3 minutes for database initialization...

### 3. Get Connection Details
Once ready, go to **Settings → Database**:

You'll see:
```
Host: [your-project].supabase.co
Port: 5432
User: postgres
Password: [your password]
Database: postgres
```

---

## 🔧 Step 2: Update Your Backend .env

Edit `/workspaces/Token/backend/.env`:

```bash
# OLD (Local PostgreSQL)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_token_db"

# NEW (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@[your-project].supabase.co:5432/postgres"
```

### Example:
```bash
DATABASE_URL="postgresql://postgres:MySuper$ecurePass@abcdef123456.supabase.co:5432/postgres"
```

---

## 📊 Step 3: Run Migrations on Supabase

```bash
cd /workspaces/Token/backend

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables on Supabase)
npm run prisma:migrate

# Seed demo data
npm run prisma:seed
```

That's it! Your database is now on Supabase! 🎉

---

## 🔍 Step 4: Verify Setup

### Option A: Verify via Supabase Dashboard
1. Go to https://app.supabase.com
2. Open your project
3. Go to **SQL Editor** or **Table Editor**
4. You should see tables: `User`, `Hospital`, `Doctor`, `Appointment`, `Payment`, `OTP`

### Option B: Verify via psql
```bash
psql -h [your-project].supabase.co -U postgres -d postgres

# Inside psql:
\dt                 # List all tables
SELECT * FROM "User";  # Check users
\q                  # Exit
```

---

## 🚀 Step 5: Restart Servers

```bash
# Terminal 1: Backend
cd /workspaces/Token/backend
npm run dev

# Terminal 2: Frontend
cd /workspaces/Token/frontend
npm run dev
```

Now go to http://localhost:5173 and login! ✅

---

## 🆘 Troubleshooting

### Error: "Can't reach database server"
**Solution**: 
- Double-check DATABASE_URL in .env
- Ensure password doesn't have special characters (or escape them)
- Check that you copied the full host name correctly
- Verify project is active in Supabase dashboard

### Error: "permission denied for schema public"
**Solution**: Run in Supabase SQL Editor:
```sql
GRANT ALL ON SCHEMA public TO postgres;
```

### Prisma Migrate Shows Error
**Solution**:
```bash
# First try:
npm run prisma:migrate -- --skip-generate

# If stuck, reset (WARNING: deletes all data):
npm run prisma:migrate reset
```

---

## 📱 Complete Migration Checklist

- [ ] 1. Create Supabase account
- [ ] 2. Create project
- [ ] 3. Copy connection details
- [ ] 4. Update `.env` file
- [ ] 5. Run `npm run prisma:generate`
- [ ] 6. Run `npm run prisma:migrate`
- [ ] 7. Run `npm run prisma:seed`
- [ ] 8. Verify tables in Supabase dashboard
- [ ] 9. Restart backend server
- [ ] 10. Test login on frontend

---

## 🎯 Quick Reference Commands

```bash
# Update environment
nano backend/.env          # Edit DATABASE_URL

# Prisma commands
npm run prisma:generate    # Generate client
npm run prisma:migrate     # Create/update tables
npm run prisma:seed        # Add demo data
npm run prisma:studio      # View data in UI

# Start servers
cd backend && npm run dev   # Backend on :5000
cd frontend && npm run dev  # Frontend on :5173
```

---

## 🔐 Security Tips

✅ **Do**: Use strong database password
✅ **Do**: Keep DATABASE_URL secret (in .env, not in code)
✅ **Do**: Use environment variables
❌ **Don't**: Commit .env file to git
❌ **Don't**: Share DATABASE_URL
❌ **Don't**: Use simple passwords

---

## 📚 Next Steps After Setup

1. ✅ Login with test phone: **9000000100**
2. ✅ Check backend console for OTP code
3. ✅ Test appointment booking
4. ✅ Test payment flow
5. ✅ Test role-based dashboards

---

## 💬 Need Help?

Check these files for more info:
- **README.md** - System overview
- **SETUP_GUIDE.md** - Detailed setup
- **backend/README.md** - Backend documentation
- **frontend/README.md** - Frontend documentation

---

**That's it! Supabase is production-ready and perfect for this project.** 🚀

After testing locally, you can easily deploy to production using:
- **Backend**: Heroku, Railway, Render
- **Frontend**: Vercel, Netlify, GitHub Pages

All will connect to the same Supabase database! ✨

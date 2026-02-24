# 🎯 Supabase Quick Setup (5 Minutes)

## 1️⃣ Create Account (2 min)
```
Go to: https://supabase.com
Sign up → Create project → Wait for initialization
```

## 2️⃣ Get Connection String (1 min)
Go to: **Settings → Database → Connection Strings**

Copy this format:
```
postgresql://postgres:PASSWORD@HOST.supabase.co:5432/postgres
```

## 3️⃣ Update .env (1 min)
```bash
nano /workspaces/Token/backend/.env
```

Change line 1 to:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.supabase.co:5432/postgres"
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

## 4️⃣ Setup Database (1 min)
```bash
cd /workspaces/Token/backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## ✅ Done!

Test it:
```bash
npm run dev
```

Go to: **http://localhost:5173**

Login with phone: **9000000100**

---

## 📚 Full Details
See **SUPABASE_SETUP.md** for complete guide with troubleshooting

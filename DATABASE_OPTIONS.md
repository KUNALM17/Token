# 🔄 Complete Setup Instructions - Supabase + Local Development

Your Supabase project is ready! Here's how to set up everything.

---

## ⚠️ Important: Network Limitation

The dev container cannot directly connect to Supabase's PostgreSQL port (5432) due to network restrictions. This is normal!

**You have 3 options:**

### ✅ **OPTION 1: Use Supabase's REST API (Recommended for Production)**
- No need to run migrations locally
- Use Supabase's auto-generated REST API
- Perfect for serverless/API-only deployment

### ✅ **OPTION 2: Run PostgreSQL Locally** 
- Use local database for development
- Easy to test everything locally
- Migrate to Supabase later

### ✅ **OPTION 3: Use SSH Tunnel to Supabase**
- Connect to Supabase through SSH tunneling
- More complex but full local development

---

## 🎯 **OPTION 1: Use Supabase REST API (Easiest)**

Supabase automatically generates REST endpoints. You don't need to migrate locally!

### Step 1: Update `.env` to use Supabase API

Edit `/workspaces/Token/backend/.env`:

```env
# Use Supabase REST API instead of direct database connection
DATABASE_URL="postgresql://postgres:Il5Hdcw1t3yvxkuJ@db.oilwihrsslsscojtpghe.supabase.co:5432/postgres"
SUPABASE_URL="https://oilwihrsslsscojtpghe.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbHdpaHJzc2xzc2NvanRwZ2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjEyODIsImV4cCI6MjA4NzQ5NzI4Mn0.3_ugkla_p3QigXUw3722Y3AWPbKQiWWxK_9PtyYsqoE"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

### Step 2: Run Migrations via Supabase CLI

Install Supabase CLI locally (on your machine, not in the container):

```bash
# On your local machine
npm install -g supabase

# Login to your Supabase account
supabase login

# Link to your project
supabase link --project-ref oilwihrsslsscojtpghe

# Create migration
supabase migration new init

# Push migrations to remote
supabase db push
```

Or use the **Supabase Dashboard** directly:

1. Go to: https://app.supabase.com
2. Select your project
3. Click **SQL Editor**
4. Run this SQL to create tables:

```sql
-- Create User table
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'PATIENT',
  "hospitalId" INTEGER,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Hospital table
CREATE TABLE "Hospital" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(15),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Doctor table
CREATE TABLE "Doctor" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "hospitalId" INTEGER REFERENCES "Hospital"(id) ON DELETE CASCADE,
  specialization VARCHAR(255),
  "consultationFee" INTEGER,
  "dailyTokenLimit" INTEGER DEFAULT 50,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Appointment table
CREATE TABLE "Appointment" (
  id SERIAL PRIMARY KEY,
  "patientId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
  "doctorId" INTEGER REFERENCES "Doctor"(id) ON DELETE CASCADE,
  "hospitalId" INTEGER REFERENCES "Hospital"(id) ON DELETE CASCADE,
  "appointmentDate" VARCHAR(10),
  "tokenNumber" INTEGER,
  status VARCHAR(50) DEFAULT 'BOOKED',
  "paymentStatus" VARCHAR(50) DEFAULT 'PENDING',
  "paymentId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("doctorId", "appointmentDate", "tokenNumber")
);

-- Create Payment table
CREATE TABLE "Payment" (
  id SERIAL PRIMARY KEY,
  "appointmentId" INTEGER UNIQUE REFERENCES "Appointment"(id) ON DELETE CASCADE,
  amount INTEGER,
  provider VARCHAR(50),
  "providerPaymentId" VARCHAR(255),
  status VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OTP table
CREATE TABLE "OTP" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
  phone VARCHAR(15),
  code VARCHAR(6),
  "expiresAt" TIMESTAMP,
  "isUsed" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_phone ON "User"(phone);
CREATE INDEX idx_appointment_date ON "Appointment"("appointmentDate");
CREATE INDEX idx_appointment_doctor ON "Appointment"("doctorId");
CREATE INDEX idx_otp_phone ON "OTP"(phone);
```

### Step 3: Seed Demo Data

Run this SQL in Supabase Dashboard:

```sql
-- Insert Hospital
INSERT INTO "Hospital" (name, address, city, state, phone) VALUES
('Demo Hospital', '123 Main Street', 'Mumbai', 'Maharashtra', '9876543210');

-- Insert Users (Doctors)
INSERT INTO "User" (phone, name, role) VALUES
('9000000001', 'Super Admin', 'SUPER_ADMIN'),
('9000000002', 'Hospital Admin', 'HOSPITAL_ADMIN'),
('9000000003', 'Dr. Amit', 'DOCTOR'),
('9000000100', 'Patient One', 'PATIENT');

-- Insert Doctors
INSERT INTO "Doctor" ("userId", "hospitalId", specialization, "consultationFee", "dailyTokenLimit") VALUES
(3, 1, 'Cardiology', 500, 50);

-- Done! Your database is ready!
```

---

## 🎯 **OPTION 2: Use Local PostgreSQL (Recommended for Development)**

This is the easiest for local development.

### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run installer
- Remember your password

### Step 2: Create Local Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hospital_token_db;

# List databases to confirm
\l

# Exit
\q
```

### Step 3: Update `.env` to Use Local Database

Edit `/workspaces/Token/backend/.env`:

```env
# Use local PostgreSQL
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hospital_token_db"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### Step 4: Run Migrations

```bash
cd /workspaces/Token/backend
npm run prisma:migrate
```

### Step 5: Seed Data

```bash
npm run prisma:seed
```

### Step 6: Start Server

```bash
npm run dev
```

✅ **Your backend is now connected!**

---

## 🎯 **OPTION 3: SSH Tunnel to Supabase**

For advanced users who want to connect locally to Supabase.

### Step 1: Install SSH

Most systems have SSH pre-installed. Check:

```bash
ssh -V
```

### Step 2: Create SSH Tunnel

```bash
# Create tunnel to Supabase (keep this running)
ssh -L 5432:db.oilwihrsslsscojtpghe.supabase.co:5432 postgres@db.oilwihrsslsscojtpghe.supabase.co
```

Or use a simpler approach with `socat`:

```bash
# Install socat
sudo apt-get install socat

# Create tunnel
socat TCP-LISTEN:5432,reuseaddr,fork TCP:db.oilwihrsslsscojtpghe.supabase.co:5432
```

### Step 3: Update `.env`

```env
# Connect through tunnel
DATABASE_URL="postgresql://postgres:Il5Hdcw1t3yvxkuJ@localhost:5432/postgres"
```

### Step 4: Run Migrations

```bash
cd /workspaces/Token/backend
npm run prisma:migrate
npm run prisma:seed
```

---

## ✅ Quickest Way Forward

### For Now (Development):

```bash
# Option A: Use local PostgreSQL (easiest)
# 1. Install PostgreSQL locally
# 2. Create database: CREATE DATABASE hospital_token_db;
# 3. Update DATABASE_URL in .env to: postgresql://postgres:PASSWORD@localhost:5432/hospital_token_db
# 4. Run: npm run prisma:migrate && npm run prisma:seed
# 5. Run: npm run dev

# Option B: Use Supabase SQL Editor (no local setup needed)
# 1. Go to Supabase dashboard
# 2. Copy-paste the SQL from above
# 3. Keep using Supabase as your database
```

### For Production (Later):

```
Local Development → Deployed to Supabase
```

---

## 🔄 Migration Path

### Phase 1: Local Development (Right Now)
```
Your Computer → PostgreSQL (localhost:5432)
```

### Phase 2: Cloud Ready (Later)
```
Your Computer → Supabase (cloud)
```

**Both use the same schema and Prisma ORM!** Just change the `DATABASE_URL`.

---

## 🚀 Next Steps

**Choose one option above and let me know:**

1. Which option you prefer (Local, Supabase REST API, or SSH Tunnel)?
2. If you have PostgreSQL installed locally?
3. Any errors you encounter?

Then I'll help you get everything running! 🎉

---

## 📞 Quick Help

**"I want the fastest setup"**
→ Use **Option 2 (Local PostgreSQL)**

**"I don't want to install anything"**
→ Use **Option 1 (Supabase REST API)**

**"I want to use Supabase from dev container"**
→ Use **Option 3 (SSH Tunnel)**

---

**Let me know which option you choose and I'll guide you step-by-step!** 🚀

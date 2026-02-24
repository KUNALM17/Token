# 📋 STEP-BY-STEP: How to Seed Demo Data

## 🎯 Quick Overview

Database schema ✅ exists → Demo data ❌ needed → Copy-paste SQL → Done!

---

## 📍 STEP 1: Open Supabase Dashboard

```
https://app.supabase.co
```

**Login** with your credentials

---

## 📍 STEP 2: Select Your Project

Look for project: **hospital-token-system**

Or URL: https://oilwihrsslsscojtpghe.supabase.co

Click on it

---

## 📍 STEP 3: Go to SQL Editor

Left sidebar → **SQL Editor**

---

## 📍 STEP 4: Create New Query

Top button → **+ New Query** or **Create New Query**

---

## 📍 STEP 5: Copy the Demo Data SQL

### FILE LOCATION:
```
/Users/kunalmani/Token1/Token/INSERT_DEMO_DATA.sql
```

### CONTENT (Full file):

```sql
-- 🌱 DEMO DATA FOR SUPABASE
-- Copy-paste this entire SQL into Supabase SQL Editor and run it
-- This will populate all test accounts and demo data

-- Insert test users (9 users + 1 admin)
INSERT INTO "User" (phone, name, role, "hospitalId", "createdAt", "updatedAt")
VALUES
  ('9000000001', 'Super Admin', 'SUPER_ADMIN', NULL, NOW(), NOW()),
  ('9000000002', 'Hospital Admin', 'HOSPITAL_ADMIN', NULL, NOW(), NOW()),
  ('9000000003', 'Dr. Rajesh Kumar', 'DOCTOR', NULL, NOW(), NOW()),
  ('9000000004', 'Dr. Priya Singh', 'DOCTOR', NULL, NOW(), NOW()),
  ('9000000005', 'Dr. Amit Patel', 'DOCTOR', NULL, NOW(), NOW()),
  ('9000000100', 'John Patient', 'PATIENT', NULL, NOW(), NOW()),
  ('9000000101', 'Alice Patient', 'PATIENT', NULL, NOW(), NOW()),
  ('9000000102', 'Bob Patient', 'PATIENT', NULL, NOW(), NOW()),
  ('9000000103', 'Carol Patient', 'PATIENT', NULL, NOW(), NOW()),
  ('9000000104', 'Dave Patient', 'PATIENT', NULL, NOW(), NOW())
ON CONFLICT (phone) DO NOTHING;

-- Insert hospital
INSERT INTO "Hospital" (name, address, city, state, phone, "createdAt", "updatedAt")
VALUES ('City Hospital', '123 Main Street', 'Mumbai', 'Maharashtra', '02212345678', NOW(), NOW())
ON CONFLICT (phone) DO NOTHING;

-- Link hospital admin to hospital
UPDATE "User" 
SET "hospitalId" = (SELECT id FROM "Hospital" WHERE name = 'City Hospital' LIMIT 1)
WHERE phone = '9000000002';

-- Insert doctors with hospital
INSERT INTO "Doctor" ("userId", "hospitalId", specialization, "consultationFee", "dailyTokenLimit", "createdAt", "updatedAt")
SELECT 
  u.id,
  h.id,
  CASE WHEN u.phone = '9000000003' THEN 'Cardiology'
       WHEN u.phone = '9000000004' THEN 'Pediatrics'
       WHEN u.phone = '9000000005' THEN 'Dermatology'
  END,
  CASE WHEN u.phone = '9000000003' THEN 500
       WHEN u.phone = '9000000004' THEN 400
       WHEN u.phone = '9000000005' THEN 450
  END,
  CASE WHEN u.phone = '9000000003' THEN 70
       WHEN u.phone = '9000000004' THEN 50
       WHEN u.phone = '9000000005' THEN 60
  END,
  NOW(),
  NOW()
FROM "User" u
CROSS JOIN "Hospital" h
WHERE u.phone IN ('9000000003', '9000000004', '9000000005')
  AND h.name = 'City Hospital'
  AND NOT EXISTS (
    SELECT 1 FROM "Doctor" 
    WHERE "userId" = u.id
  )
ON CONFLICT DO NOTHING;

-- Link doctors to hospital admin and patients to hospital
UPDATE "User" 
SET "hospitalId" = (SELECT id FROM "Hospital" WHERE name = 'City Hospital' LIMIT 1)
WHERE role IN ('DOCTOR', 'PATIENT')
  AND "hospitalId" IS NULL;

-- Optional: Insert sample appointments (optional)
-- Uncomment if you want to test appointment flow
-- INSERT INTO "Appointment" ("patientId", "doctorId", "hospitalId", "appointmentDate", "tokenNumber", status, "paymentStatus", "createdAt", "updatedAt")
-- SELECT 
--   p.id,
--   d.id,
--   h.id,
--   CURRENT_DATE + INTERVAL '1 day',
--   1,
--   'BOOKED',
--   'PENDING',
--   NOW(),
--   NOW()
-- FROM "User" p, "Doctor" d, "Hospital" h
-- WHERE p.phone = '9000000100'
--   AND d.id = (SELECT id FROM "Doctor" LIMIT 1)
--   AND h.name = 'City Hospital'
-- LIMIT 1;
```

---

## 📍 STEP 6: Paste Into Supabase SQL Editor

In the SQL query box, **paste the entire SQL code** above

---

## 📍 STEP 7: Execute the Query

**Click RUN** or press **Ctrl+Enter**

Wait 2-3 seconds...

---

## ✅ STEP 8: Verify Success

You should see:
```
Query successful
X rows affected
```

Green checkmark ✅ appears

---

## 🔍 STEP 9: Verify Data Created

Go to **Table Editor** (left sidebar):

1. Click **User** table → Should see 10 users
2. Click **Hospital** table → Should see 1 hospital
3. Click **Doctor** table → Should see 3 doctors

---

## 🎉 DONE!

Demo data successfully seeded! ✅

Now you can:
1. Start backend: `npm run dev`
2. Start frontend: `npm run dev`
3. Login with phone: `9000000100`

---

## 👥 Test Accounts Created

| Role | Phone | Name | Password |
|------|-------|------|----------|
| Super Admin | 9000000001 | Super Admin | OTP |
| Hospital Admin | 9000000002 | Hospital Admin | OTP |
| Doctor 1 | 9000000003 | Dr. Rajesh Kumar | OTP |
| Doctor 2 | 9000000004 | Dr. Priya Singh | OTP |
| Doctor 3 | 9000000005 | Dr. Amit Patel | OTP |
| Patient 1 | 9000000100 | John Patient | OTP |
| Patient 2 | 9000000101 | Alice Patient | OTP |
| Patient 3 | 9000000102 | Bob Patient | OTP |
| Patient 4 | 9000000103 | Carol Patient | OTP |
| Patient 5 | 9000000104 | Dave Patient | OTP |

**Login Method**: OTP sent to phone (check backend console)

---

## ⏱️ Time Needed: 2-3 minutes

All done! 🚀

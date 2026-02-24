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
ON CONFLICT ("userId") DO NOTHING;

-- Insert sample appointments (5 appointments)
INSERT INTO "Appointment" ("patientId", "doctorId", "hospitalId", "appointmentDate", "tokenNumber", status, "createdAt", "updatedAt")
SELECT 
  p.id,
  d.id,
  h.id,
  CURRENT_DATE,
  ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY p.phone) as token_number,
  'BOOKED',
  NOW(),
  NOW()
FROM "User" p
CROSS JOIN "Doctor" d
CROSS JOIN "Hospital" h
WHERE p.phone IN ('9000000100', '9000000101', '9000000102', '9000000103', '9000000104')
AND h.name = 'City Hospital'
AND d."hospitalId" = h.id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Verify data was inserted
SELECT 
  'Users' as table_name, 
  COUNT(*) as row_count 
FROM "User"
UNION ALL
SELECT 'Hospitals', COUNT(*) FROM "Hospital"
UNION ALL
SELECT 'Doctors', COUNT(*) FROM "Doctor"
UNION ALL
SELECT 'Appointments', COUNT(*) FROM "Appointment";

-- Run this SQL in your Supabase SQL Editor at: https://app.supabase.com
-- Steps:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Paste ALL of this SQL below
-- 6. Click "Run"
-- 7. Done! Database is ready

-- ============================================================================
-- CREATE TABLES FOR HOSPITAL TOKEN SYSTEM
-- ============================================================================

-- User table (Super Admin, Hospital Admin, Doctor, Patient)
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'PATIENT' CHECK (role IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT')),
  "hospitalId" INTEGER,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospital table
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

-- Doctor table
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

-- Appointment table
CREATE TABLE "Appointment" (
  id SERIAL PRIMARY KEY,
  "patientId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
  "doctorId" INTEGER REFERENCES "Doctor"(id) ON DELETE CASCADE,
  "hospitalId" INTEGER REFERENCES "Hospital"(id) ON DELETE CASCADE,
  "appointmentDate" VARCHAR(10),
  "tokenNumber" INTEGER,
  status VARCHAR(50) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CALLED', 'COMPLETED', 'SKIPPED', 'CANCELLED')),
  "paymentStatus" VARCHAR(50) DEFAULT 'PENDING' CHECK ("paymentStatus" IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  "paymentId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("doctorId", "appointmentDate", "tokenNumber")
);

-- Payment table
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

-- OTP table
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
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_doctor_hospital ON "Doctor"("hospitalId");
CREATE INDEX idx_appointment_date ON "Appointment"("appointmentDate");
CREATE INDEX idx_appointment_doctor ON "Appointment"("doctorId");
CREATE INDEX idx_appointment_patient ON "Appointment"("patientId");
CREATE INDEX idx_otp_phone ON "OTP"(phone);
CREATE INDEX idx_otp_expires ON "OTP"("expiresAt");

-- ============================================================================
-- INSERT DEMO DATA
-- ============================================================================

-- 1. Create Hospital
INSERT INTO "Hospital" (name, address, city, state, phone) VALUES
('Demo Hospital', '123 Medical Street', 'Mumbai', 'Maharashtra', '9876543210');

-- 2. Create Users
INSERT INTO "User" (phone, name, role) VALUES
('9000000001', 'Super Admin', 'SUPER_ADMIN'),
('9000000002', 'Hospital Admin', 'HOSPITAL_ADMIN'),
('9000000003', 'Dr. Amit Kumar', 'DOCTOR'),
('9000000004', 'Dr. Priya Singh', 'DOCTOR'),
('9000000005', 'Dr. Rajesh Patel', 'DOCTOR'),
('9000000100', 'Patient One', 'PATIENT'),
('9000000101', 'Patient Two', 'PATIENT'),
('9000000102', 'Patient Three', 'PATIENT'),
('9000000103', 'Patient Four', 'PATIENT'),
('9000000104', 'Patient Five', 'PATIENT');

-- 3. Create Doctors (link to users and hospital)
INSERT INTO "Doctor" ("userId", "hospitalId", specialization, "consultationFee", "dailyTokenLimit") VALUES
(3, 1, 'Cardiology', 500, 50),
(4, 1, 'Pediatrics', 300, 40),
(5, 1, 'Dermatology', 400, 45);

-- 4. Create Sample Appointments
INSERT INTO "Appointment" ("patientId", "doctorId", "hospitalId", "appointmentDate", "tokenNumber", status, "paymentStatus") VALUES
(6, 1, 1, '2026-02-24', 1, 'CALLED', 'PAID'),
(7, 1, 1, '2026-02-24', 2, 'BOOKED', 'PAID'),
(8, 1, 1, '2026-02-24', 3, 'BOOKED', 'PENDING'),
(9, 2, 1, '2026-02-24', 1, 'CALLED', 'PAID'),
(10, 2, 1, '2026-02-24', 2, 'BOOKED', 'PAID');

-- ============================================================================
-- Done! Your database is ready to use
-- ============================================================================
-- Test Accounts Created:
-- Super Admin: 9000000001
-- Hospital Admin: 9000000002
-- Doctor 1: 9000000003 (Cardiology)
-- Doctor 2: 9000000004 (Pediatrics)
-- Doctor 3: 9000000005 (Dermatology)
-- Patient 1-5: 9000000100 to 9000000104
--
-- Next steps:
-- 1. Check your backend server is still running
-- 2. Open http://localhost:5173 in browser
-- 3. Login with any phone number above
-- 4. OTP code will appear in backend console
-- ============================================================================

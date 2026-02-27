import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Wiping all data...');

  // Delete in order to respect FK constraints
  await prisma.oTP.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorShift.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hospital.deleteMany();

  console.log('✅ All data wiped\n');

  // ────────────────────────────────────────
  // 1. CREATE SUPER ADMIN
  // ────────────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: { phone: '9999999999', name: 'Super Admin', role: 'SUPER_ADMIN' },
  });
  console.log(`👑 Super Admin: ${superAdmin.phone} (${superAdmin.name})`);

  // ────────────────────────────────────────
  // 2. CREATE 3 HOSPITALS
  // ────────────────────────────────────────
  const hospitalsData = [
    { name: 'Apollo Care Hospital',     address: 'MG Road, Bangalore',        city: 'Bangalore', state: 'Karnataka', phone: '0801234567', maxBookingDaysAhead: 7 },
    { name: 'Sunrise Medical Centre',   address: 'Jubilee Hills, Hyderabad',  city: 'Hyderabad', state: 'Telangana', phone: '0409876543', maxBookingDaysAhead: 10 },
    { name: 'CityLife Multi Specialty', address: 'Andheri West, Mumbai',      city: 'Mumbai',    state: 'Maharashtra', phone: '0225556789', maxBookingDaysAhead: 5 },
  ];

  const hospitals = [];
  for (const h of hospitalsData) {
    hospitals.push(await prisma.hospital.create({ data: h }));
  }
  console.log(`🏥 Created ${hospitals.length} hospitals\n`);

  // ────────────────────────────────────────
  // 3. CREATE HOSPITAL ADMINS (one per hospital)
  // ────────────────────────────────────────
  const adminPhones = ['8000000001', '8000000002', '8000000003'];
  const adminNames  = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel'];
  const admins = [];
  for (let i = 0; i < 3; i++) {
    admins.push(await prisma.user.create({
      data: { phone: adminPhones[i], name: adminNames[i], role: 'HOSPITAL_ADMIN', hospitalId: hospitals[i].id },
    }));
  }
  console.log(`🔑 Created ${admins.length} hospital admins`);

  // ────────────────────────────────────────
  // 4. CREATE DOCTORS (3-4 per hospital)
  // ────────────────────────────────────────
  const doctorsConfig = [
    // Hospital 1 — Apollo Care (4 doctors)
    { phone: '7000000001', name: 'Dr. Ananya Iyer',    spec: 'Cardiology',     fee: 800,  hospital: 0, avgTime: 8 },
    { phone: '7000000002', name: 'Dr. Vikram Reddy',   spec: 'Orthopedics',    fee: 600,  hospital: 0, avgTime: 10 },
    { phone: '7000000003', name: 'Dr. Meera Nair',     spec: 'Dermatology',    fee: 500,  hospital: 0, avgTime: 5 },
    { phone: '7000000004', name: 'Dr. Suresh Babu',    spec: 'General Medicine',fee: 400, hospital: 0, avgTime: 6 },
    // Hospital 2 — Sunrise Medical (3 doctors)
    { phone: '7000000005', name: 'Dr. Kavitha Rao',    spec: 'Gynecology',     fee: 700,  hospital: 1, avgTime: 12 },
    { phone: '7000000006', name: 'Dr. Arjun Menon',    spec: 'Pediatrics',     fee: 500,  hospital: 1, avgTime: 7 },
    { phone: '7000000007', name: 'Dr. Deepa Kulkarni', spec: 'ENT',            fee: 550,  hospital: 1, avgTime: 6 },
    // Hospital 3 — CityLife Multi (3 doctors)
    { phone: '7000000008', name: 'Dr. Rohit Joshi',    spec: 'Neurology',      fee: 900,  hospital: 2, avgTime: 15 },
    { phone: '7000000009', name: 'Dr. Sneha Desai',    spec: 'Ophthalmology',  fee: 650,  hospital: 2, avgTime: 8 },
    { phone: '7000000010', name: 'Dr. Manoj Tiwari',   spec: 'Pulmonology',    fee: 600,  hospital: 2, avgTime: 10 },
  ];

  const doctors: any[] = [];
  for (const dc of doctorsConfig) {
    const user = await prisma.user.create({
      data: { phone: dc.phone, name: dc.name, role: 'DOCTOR', hospitalId: hospitals[dc.hospital].id },
    });
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        hospitalId: hospitals[dc.hospital].id,
        specialization: dc.spec,
        consultationFee: dc.fee,
        avgConsultTime: dc.avgTime,
      },
    });
    doctors.push({ ...doctor, user, hospitalIndex: dc.hospital });
  }
  console.log(`🩺 Created ${doctors.length} doctors`);

  // ────────────────────────────────────────
  // 5. CREATE SHIFTS (2 shifts per doctor: Morning & Evening)
  // ────────────────────────────────────────
  const shiftsCreated: any[] = [];
  for (const doc of doctors) {
    const morningShift = await prisma.doctorShift.create({
      data: {
        doctorId: doc.id,
        shiftName: 'Morning',
        startTime: '09:00',
        endTime: '13:00',
        tokenLimit: 20,
        workingDays: '1,2,3,4,5,6', // Mon-Sat
      },
    });
    const eveningShift = await prisma.doctorShift.create({
      data: {
        doctorId: doc.id,
        shiftName: 'Evening',
        startTime: '16:00',
        endTime: '20:00',
        tokenLimit: 15,
        workingDays: '1,2,3,4,5', // Mon-Fri
      },
    });
    shiftsCreated.push({ doctorId: doc.id, hospitalIndex: doc.hospitalIndex, morning: morningShift, evening: eveningShift });
  }
  console.log(`⏰ Created ${shiftsCreated.length * 2} shifts (2 per doctor)`);

  // ────────────────────────────────────────
  // 6. CREATE PATIENTS (7-8 per hospital = ~23 total)
  // ────────────────────────────────────────
  const patientsConfig = [
    // Hospital 1 patients (8)
    { phone: '6000000001', name: 'Rahul Verma',     age: 28, gender: 'Male',   city: 'Bangalore', hospital: 0 },
    { phone: '6000000002', name: 'Divya Shetty',    age: 34, gender: 'Female', city: 'Bangalore', hospital: 0 },
    { phone: '6000000003', name: 'Karan Malhotra',  age: 45, gender: 'Male',   city: 'Bangalore', hospital: 0 },
    { phone: '6000000004', name: 'Neha Gupta',      age: 22, gender: 'Female', city: 'Bangalore', hospital: 0 },
    { phone: '6000000005', name: 'Arun Prasad',     age: 55, gender: 'Male',   city: 'Mysore',    hospital: 0 },
    { phone: '6000000006', name: 'Lakshmi Devi',    age: 62, gender: 'Female', city: 'Bangalore', hospital: 0 },
    { phone: '6000000007', name: 'Sameer Khan',     age: 38, gender: 'Male',   city: 'Bangalore', hospital: 0 },
    { phone: '6000000008', name: 'Pooja Hegde',     age: 29, gender: 'Female', city: 'Mangalore', hospital: 0 },
    // Hospital 2 patients (7)
    { phone: '6000000009', name: 'Venkat Raman',    age: 42, gender: 'Male',   city: 'Hyderabad', hospital: 1 },
    { phone: '6000000010', name: 'Swathi Reddy',    age: 31, gender: 'Female', city: 'Hyderabad', hospital: 1 },
    { phone: '6000000011', name: 'Ravi Teja',       age: 26, gender: 'Male',   city: 'Secunderabad', hospital: 1 },
    { phone: '6000000012', name: 'Anjali Kumari',   age: 35, gender: 'Female', city: 'Hyderabad', hospital: 1 },
    { phone: '6000000013', name: 'Mohan Das',       age: 50, gender: 'Male',   city: 'Warangal',  hospital: 1 },
    { phone: '6000000014', name: 'Fatima Begum',    age: 40, gender: 'Female', city: 'Hyderabad', hospital: 1 },
    { phone: '6000000015', name: 'Siddharth Nair',  age: 33, gender: 'Male',   city: 'Hyderabad', hospital: 1 },
    // Hospital 3 patients (8)
    { phone: '6000000016', name: 'Akash Mehta',     age: 27, gender: 'Male',   city: 'Mumbai',    hospital: 2 },
    { phone: '6000000017', name: 'Ritu Singh',      age: 36, gender: 'Female', city: 'Mumbai',    hospital: 2 },
    { phone: '6000000018', name: 'Vishal Patil',    age: 48, gender: 'Male',   city: 'Pune',      hospital: 2 },
    { phone: '6000000019', name: 'Aditi Bhatt',     age: 24, gender: 'Female', city: 'Mumbai',    hospital: 2 },
    { phone: '6000000020', name: 'Dinesh Yadav',    age: 58, gender: 'Male',   city: 'Thane',     hospital: 2 },
    { phone: '6000000021', name: 'Komal Jain',      age: 30, gender: 'Female', city: 'Mumbai',    hospital: 2 },
    { phone: '6000000022', name: 'Pranav Deshmukh', age: 41, gender: 'Male',   city: 'Navi Mumbai', hospital: 2 },
    { phone: '6000000023', name: 'Sonal Kapoor',    age: 37, gender: 'Female', city: 'Mumbai',    hospital: 2 },
  ];

  const patients: any[] = [];
  for (const pc of patientsConfig) {
    const user = await prisma.user.create({
      data: {
        phone: pc.phone,
        name: pc.name,
        role: 'PATIENT',
        hospitalId: hospitals[pc.hospital].id,
        age: pc.age,
        gender: pc.gender,
        city: pc.city,
      },
    });
    patients.push({ ...user, hospitalIndex: pc.hospital });
  }
  console.log(`👤 Created ${patients.length} patients\n`);

  // ────────────────────────────────────────
  // 7. CREATE BOOKINGS
  // ────────────────────────────────────────
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log(`📅 Today: ${todayStr}`);

  // Helper: create an appointment + payment if PAID
  let appointmentCount = 0;
  let paymentCount = 0;

  async function createBooking(opts: {
    patientId: number; doctorId: number; hospitalId: number; shiftId: number;
    date: string; tokenNumber: number; status: string; paymentStatus: string; fee: number;
  }) {
    const appt = await prisma.appointment.create({
      data: {
        patientId: opts.patientId,
        doctorId: opts.doctorId,
        hospitalId: opts.hospitalId,
        shiftId: opts.shiftId,
        appointmentDate: opts.date,
        tokenNumber: opts.tokenNumber,
        status: opts.status,
        paymentStatus: opts.paymentStatus,
      },
    });
    appointmentCount++;

    if (opts.paymentStatus === 'PAID') {
      await prisma.payment.create({
        data: {
          appointmentId: appt.id,
          amount: opts.fee,
          provider: 'DEMO',
          providerPaymentId: `DEMO_SEED_${appt.id}_${Date.now().toString(36)}`,
          status: 'SUCCESS',
        },
      });
      paymentCount++;
    }
    return appt;
  }

  // ── Hospital 1 bookings (Apollo Care) ──
  const h1Doctors = doctors.filter(d => d.hospitalIndex === 0);
  const h1Patients = patients.filter(p => p.hospitalIndex === 0);
  const h1Shifts = shiftsCreated.filter(s => s.hospitalIndex === 0);

  // Today — Dr. Ananya (Cardiology) Morning — 4 booked patients
  for (let i = 0; i < 4; i++) {
    await createBooking({
      patientId: h1Patients[i].id, doctorId: h1Doctors[0].id, hospitalId: hospitals[0].id,
      shiftId: h1Shifts[0].morning.id, date: todayStr, tokenNumber: i + 1,
      status: i === 0 ? 'COMPLETED' : i === 1 ? 'CALLED' : 'BOOKED', paymentStatus: 'PAID', fee: 800,
    });
  }

  // Today — Dr. Vikram (Ortho) Morning — 3 booked
  for (let i = 0; i < 3; i++) {
    await createBooking({
      patientId: h1Patients[i + 4].id, doctorId: h1Doctors[1].id, hospitalId: hospitals[0].id,
      shiftId: h1Shifts[1].morning.id, date: todayStr, tokenNumber: i + 1,
      status: 'BOOKED', paymentStatus: 'PAID', fee: 600,
    });
  }

  // Tomorrow — Dr. Meera (Derma) Morning — 2 booked + 1 pending
  await createBooking({
    patientId: h1Patients[0].id, doctorId: h1Doctors[2].id, hospitalId: hospitals[0].id,
    shiftId: h1Shifts[2].morning.id, date: tomorrowStr, tokenNumber: 1,
    status: 'BOOKED', paymentStatus: 'PAID', fee: 500,
  });
  await createBooking({
    patientId: h1Patients[1].id, doctorId: h1Doctors[2].id, hospitalId: hospitals[0].id,
    shiftId: h1Shifts[2].morning.id, date: tomorrowStr, tokenNumber: 2,
    status: 'BOOKED', paymentStatus: 'PAID', fee: 500,
  });
  await createBooking({
    patientId: h1Patients[7].id, doctorId: h1Doctors[2].id, hospitalId: hospitals[0].id,
    shiftId: h1Shifts[2].morning.id, date: tomorrowStr, tokenNumber: -1,
    status: 'PENDING', paymentStatus: 'PENDING', fee: 500,
  });

  // Yesterday — Dr. Suresh (General) — 2 completed
  await createBooking({
    patientId: h1Patients[5].id, doctorId: h1Doctors[3].id, hospitalId: hospitals[0].id,
    shiftId: h1Shifts[3].morning.id, date: yesterdayStr, tokenNumber: 1,
    status: 'COMPLETED', paymentStatus: 'PAID', fee: 400,
  });
  await createBooking({
    patientId: h1Patients[6].id, doctorId: h1Doctors[3].id, hospitalId: hospitals[0].id,
    shiftId: h1Shifts[3].morning.id, date: yesterdayStr, tokenNumber: 2,
    status: 'COMPLETED', paymentStatus: 'PAID', fee: 400,
  });

  // ── Hospital 2 bookings (Sunrise Medical) ──
  const h2Doctors = doctors.filter(d => d.hospitalIndex === 1);
  const h2Patients = patients.filter(p => p.hospitalIndex === 1);
  const h2Shifts = shiftsCreated.filter(s => s.hospitalIndex === 1);

  // Today — Dr. Kavitha (Gynecology) Morning — 3 booked
  for (let i = 0; i < 3; i++) {
    await createBooking({
      patientId: h2Patients[i].id, doctorId: h2Doctors[0].id, hospitalId: hospitals[1].id,
      shiftId: h2Shifts[0].morning.id, date: todayStr, tokenNumber: i + 1,
      status: i === 0 ? 'CALLED' : 'BOOKED', paymentStatus: 'PAID', fee: 700,
    });
  }

  // Today — Dr. Arjun (Pediatrics) Evening — 2 booked + 1 pending
  await createBooking({
    patientId: h2Patients[3].id, doctorId: h2Doctors[1].id, hospitalId: hospitals[1].id,
    shiftId: h2Shifts[1].evening.id, date: todayStr, tokenNumber: 1,
    status: 'BOOKED', paymentStatus: 'PAID', fee: 500,
  });
  await createBooking({
    patientId: h2Patients[4].id, doctorId: h2Doctors[1].id, hospitalId: hospitals[1].id,
    shiftId: h2Shifts[1].evening.id, date: todayStr, tokenNumber: 2,
    status: 'BOOKED', paymentStatus: 'PAID', fee: 500,
  });
  await createBooking({
    patientId: h2Patients[5].id, doctorId: h2Doctors[1].id, hospitalId: hospitals[1].id,
    shiftId: h2Shifts[1].evening.id, date: todayStr, tokenNumber: -1,
    status: 'PENDING', paymentStatus: 'PENDING', fee: 500,
  });

  // Tomorrow — Dr. Deepa (ENT) Morning — 3 booked
  for (let i = 0; i < 3; i++) {
    await createBooking({
      patientId: h2Patients[i].id, doctorId: h2Doctors[2].id, hospitalId: hospitals[1].id,
      shiftId: h2Shifts[2].morning.id, date: tomorrowStr, tokenNumber: i + 1,
      status: 'BOOKED', paymentStatus: 'PAID', fee: 550,
    });
  }

  // Day after — Dr. Kavitha — 1 booked
  await createBooking({
    patientId: h2Patients[6].id, doctorId: h2Doctors[0].id, hospitalId: hospitals[1].id,
    shiftId: h2Shifts[0].morning.id, date: dayAfterStr, tokenNumber: 1,
    status: 'BOOKED', paymentStatus: 'PAID', fee: 700,
  });

  // Yesterday — Dr. Arjun — 2 completed + 1 skipped
  await createBooking({
    patientId: h2Patients[0].id, doctorId: h2Doctors[1].id, hospitalId: hospitals[1].id,
    shiftId: h2Shifts[1].morning.id, date: yesterdayStr, tokenNumber: 1,
    status: 'COMPLETED', paymentStatus: 'PAID', fee: 500,
  });
  await createBooking({
    patientId: h2Patients[1].id, doctorId: h2Doctors[1].id, hospitalId: hospitals[1].id,
    shiftId: h2Shifts[1].morning.id, date: yesterdayStr, tokenNumber: 2,
    status: 'COMPLETED', paymentStatus: 'PAID', fee: 500,
  });
  await createBooking({
    patientId: h2Patients[2].id, doctorId: h2Doctors[1].id, hospitalId: hospitals[1].id,
    shiftId: h2Shifts[1].morning.id, date: yesterdayStr, tokenNumber: 3,
    status: 'SKIPPED', paymentStatus: 'PAID', fee: 500,
  });

  // ── Hospital 3 bookings (CityLife Multi) ──
  const h3Doctors = doctors.filter(d => d.hospitalIndex === 2);
  const h3Patients = patients.filter(p => p.hospitalIndex === 2);
  const h3Shifts = shiftsCreated.filter(s => s.hospitalIndex === 2);

  // Today — Dr. Rohit (Neurology) Morning — 4 booked
  for (let i = 0; i < 4; i++) {
    await createBooking({
      patientId: h3Patients[i].id, doctorId: h3Doctors[0].id, hospitalId: hospitals[2].id,
      shiftId: h3Shifts[0].morning.id, date: todayStr, tokenNumber: i + 1,
      status: i < 2 ? 'COMPLETED' : 'BOOKED', paymentStatus: 'PAID', fee: 900,
    });
  }

  // Today — Dr. Sneha (Ophthalmology) Morning — 3 booked
  for (let i = 0; i < 3; i++) {
    await createBooking({
      patientId: h3Patients[i + 4].id, doctorId: h3Doctors[1].id, hospitalId: hospitals[2].id,
      shiftId: h3Shifts[1].morning.id, date: todayStr, tokenNumber: i + 1,
      status: i === 0 ? 'CALLED' : 'BOOKED', paymentStatus: 'PAID', fee: 650,
    });
  }

  // Tomorrow — Dr. Manoj (Pulmonology) Evening — 2 booked + 2 pending
  await createBooking({
    patientId: h3Patients[0].id, doctorId: h3Doctors[2].id, hospitalId: hospitals[2].id,
    shiftId: h3Shifts[2].evening.id, date: tomorrowStr, tokenNumber: 1,
    status: 'BOOKED', paymentStatus: 'PAID', fee: 600,
  });
  await createBooking({
    patientId: h3Patients[1].id, doctorId: h3Doctors[2].id, hospitalId: hospitals[2].id,
    shiftId: h3Shifts[2].evening.id, date: tomorrowStr, tokenNumber: 2,
    status: 'BOOKED', paymentStatus: 'PAID', fee: 600,
  });
  await createBooking({
    patientId: h3Patients[6].id, doctorId: h3Doctors[2].id, hospitalId: hospitals[2].id,
    shiftId: h3Shifts[2].evening.id, date: tomorrowStr, tokenNumber: -1,
    status: 'PENDING', paymentStatus: 'PENDING', fee: 600,
  });
  await createBooking({
    patientId: h3Patients[7].id, doctorId: h3Doctors[2].id, hospitalId: hospitals[2].id,
    shiftId: h3Shifts[2].evening.id, date: tomorrowStr, tokenNumber: -2,
    status: 'PENDING', paymentStatus: 'PENDING', fee: 600,
  });

  // Yesterday — Dr. Rohit — 3 completed
  for (let i = 0; i < 3; i++) {
    await createBooking({
      patientId: h3Patients[i + 5].id, doctorId: h3Doctors[0].id, hospitalId: hospitals[2].id,
      shiftId: h3Shifts[0].morning.id, date: yesterdayStr, tokenNumber: i + 1,
      status: 'COMPLETED', paymentStatus: 'PAID', fee: 900,
    });
  }

  console.log(`\n📋 Created ${appointmentCount} appointments (${paymentCount} paid)\n`);

  // ────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────
  console.log('═══════════════════════════════════════════');
  console.log('            SEED DATA SUMMARY             ');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('👑 SUPER ADMIN');
  console.log('   Phone: 9999999999');
  console.log('');
  console.log('🏥 HOSPITALS & ADMINS');
  for (let i = 0; i < 3; i++) {
    console.log(`   ${i + 1}. ${hospitals[i].name}`);
    console.log(`      Admin: ${adminNames[i]} — Phone: ${adminPhones[i]}`);
  }
  console.log('');
  console.log('🩺 DOCTORS');
  for (const dc of doctorsConfig) {
    console.log(`   ${dc.name} — ${dc.spec} — ₹${dc.fee} — Phone: ${dc.phone}`);
    console.log(`      Hospital: ${hospitalsData[dc.hospital].name}`);
  }
  console.log('');
  console.log('👤 PATIENTS (login with any of these phones)');
  for (const pc of patientsConfig) {
    console.log(`   ${pc.name} — Phone: ${pc.phone} — ${pc.city}`);
  }
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  OTP for all logins: 123456 (if dev mode)');
  console.log('═══════════════════════════════════════════');
}

main()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (in reverse order of dependencies)
  try {
    await prisma.payment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.oTP.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.user.deleteMany();
    await prisma.hospital.deleteMany();
    console.log('✓ Cleaned existing data');
  } catch (e) {
    console.log('⚠️ Cleanup skipped (tables may be empty)');
  }

  // Create hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: 'City Medical Center',
      address: '123 Healthcare Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '9876543210',
    },
  });
  console.log('✓ Hospital created:', hospital.name);

  // Create super admin
  const superAdmin = await prisma.user.create({
    data: {
      phone: '9000000001',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✓ Super Admin created:', superAdmin.phone);

  // Create hospital admin
  const admin = await prisma.user.create({
    data: {
      phone: '9000000002',
      name: 'Hospital Admin',
      role: 'HOSPITAL_ADMIN',
      hospitalId: hospital.id,
    },
  });
  console.log('✓ Hospital Admin created:', admin.phone);

  // Create doctors
  const doctor1User = await prisma.user.create({
    data: {
      phone: '9000000003',
      name: 'Dr. Rajesh Kumar',
      role: 'DOCTOR',
      hospitalId: hospital.id,
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: doctor1User.id,
      hospitalId: hospital.id,
      specialization: 'Cardiology',
      consultationFee: 500,
      dailyTokenLimit: 70,
    },
  });
  console.log('✓ Doctor 1 created:', doctor1User.name);

  const doctor2User = await prisma.user.create({
    data: {
      phone: '9000000004',
      name: 'Dr. Priya Singh',
      role: 'DOCTOR',
      hospitalId: hospital.id,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: doctor2User.id,
      hospitalId: hospital.id,
      specialization: 'Pediatrics',
      consultationFee: 400,
      dailyTokenLimit: 50,
    },
  });
  console.log('✓ Doctor 2 created:', doctor2User.name);

  const doctor3User = await prisma.user.create({
    data: {
      phone: '9000000005',
      name: 'Dr. Amit Patel',
      role: 'DOCTOR',
      hospitalId: hospital.id,
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      userId: doctor3User.id,
      hospitalId: hospital.id,
      specialization: 'Dermatology',
      consultationFee: 350,
      dailyTokenLimit: 60,
    },
  });
  console.log('✓ Doctor 3 created:', doctor3User.name);

  // Create sample patients with appointments
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 5; i++) {
    const patient = await prisma.user.create({
      data: {
        phone: `900000010${i}`,
        name: `Patient ${i + 1}`,
        role: 'PATIENT',
      },
    });

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor1.id,
        hospitalId: hospital.id,
        appointmentDate: today,
        tokenNumber: i + 1,
        status: i === 0 ? 'CALLED' : 'BOOKED',
        paymentStatus: 'PAID',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: doctor1.consultationFee,
        provider: 'razorpay',
        status: 'PAID',
      },
    });
  }
  console.log('✓ 5 patients and appointments created');

  console.log('\n✅ Database seeding completed!');
  console.log('\n📱 Test Credentials:');
  console.log('Super Admin:    9000000001');
  console.log('Hospital Admin: 9000000002');
  console.log('Doctor 1:       9000000003 (Cardiology)');
  console.log('Doctor 2:       9000000004 (Pediatrics)');
  console.log('Doctor 3:       9000000005 (Dermatology)');
  console.log('Patients:       9000000100 - 9000000104');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

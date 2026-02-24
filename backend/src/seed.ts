import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create hospital
  const hospital = await prisma.hospital.create({
    data: {
      id: uuidv4(),
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
      id: uuidv4(),
      phone: '9000000001',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✓ Super Admin created:', superAdmin.phone);

  // Create hospital admin
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
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
      id: uuidv4(),
      phone: '9000000003',
      name: 'Dr. Rajesh Kumar',
      role: 'DOCTOR',
      hospitalId: hospital.id,
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      id: uuidv4(),
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
      id: uuidv4(),
      phone: '9000000004',
      name: 'Dr. Priya Singh',
      role: 'DOCTOR',
      hospitalId: hospital.id,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      id: uuidv4(),
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
      id: uuidv4(),
      phone: '9000000005',
      name: 'Dr. Amit Patel',
      role: 'DOCTOR',
      hospitalId: hospital.id,
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      id: uuidv4(),
      userId: doctor3User.id,
      hospitalId: hospital.id,
      specialization: 'Dermatology',
      consultationFee: 350,
      dailyTokenLimit: 60,
    },
  });
  console.log('✓ Doctor 3 created:', doctor3User.name);

  // Create sample patients
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 5; i++) {
    const patient = await prisma.user.create({
      data: {
        id: uuidv4(),
        phone: `900000010${i}`,
        name: `Patient ${i + 1}`,
        role: 'PATIENT',
      },
    });

    // Create appointments
    const appointment = await prisma.appointment.create({
      data: {
        id: uuidv4(),
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
        id: uuidv4(),
        appointmentId: appointment.id,
        amount: doctor1.consultationFee,
        provider: 'razorpay',
        status: 'PAID',
      },
    });
  }
  console.log('✓ Sample appointments created');

  console.log('\n✅ Database seeding completed!');
  console.log('\n📱 Test Credentials:');
  console.log('Super Admin: +91 9000000001');
  console.log('Hospital Admin: +91 9000000002');
  console.log('Doctor 1: +91 9000000003 (Cardiology, 70 tokens/day)');
  console.log('Doctor 2: +91 9000000004 (Pediatrics, 50 tokens/day)');
  console.log('Doctor 3: +91 9000000005 (Dermatology, 60 tokens/day)');
  console.log('Patient: +91 9000000100 onwards (OTP: 000000 for testing)');
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

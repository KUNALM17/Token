import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth.routes';
import superAdminRoutes from './routes/superAdmin.routes';
import hospitalAdminRoutes from './routes/hospitalAdmin.routes';
import doctorRoutes from './routes/doctor.routes';
import patientRoutes from './routes/patient.routes';
import paymentRoutes from './routes/payment.routes';

// Middleware
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
export const prisma = new PrismaClient({ errorFormat: 'pretty' });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/super-admin', superAdminRoutes);
app.use('/hospital-admin', hospitalAdminRoutes);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/payments', paymentRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ── AUTO-SHIFT: Move unviewed past appointments to today ──
// If a BOOKED/PENDING appointment's date has passed and the doctor never
// viewed/called/completed it, automatically move it to today.
async function autoShiftUnviewedAppointments() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find all BOOKED or PENDING appointments from past dates
    // These are appointments the doctor never acted on
    const staleAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: { lt: today },
        status: { in: ['BOOKED', 'PENDING'] },
        // Only BOOKED (paid) or PENDING (unpaid) — not CALLED/COMPLETED/SKIPPED/CANCELLED
      },
      include: { shift: true, doctor: true, patient: true },
    });

    if (staleAppointments.length === 0) return;

    console.log(`📅 Auto-shift: Found ${staleAppointments.length} unviewed past appointment(s)`);

    let shifted = 0;
    let failed = 0;

    for (const apt of staleAppointments) {
      try {
        // Check shift capacity for today
        if (apt.shiftId) {
          const todayCount = await prisma.appointment.count({
            where: {
              doctorId: apt.doctorId,
              appointmentDate: today,
              shiftId: apt.shiftId,
              status: { not: 'CANCELLED' },
            },
          });

          const shift = apt.shift;
          if (shift && todayCount >= shift.tokenLimit) {
            // Shift is full for today — skip this one (patient will need to reschedule manually)
            console.log(`  ⚠ Appointment #${apt.id}: Shift full for today, skipping auto-shift`);
            failed++;
            continue;
          }
        }

        // Check if patient already has an appointment with this doctor today
        const existingToday = await prisma.appointment.findFirst({
          where: {
            patientId: apt.patientId,
            doctorId: apt.doctorId,
            appointmentDate: today,
            status: { not: 'CANCELLED' },
            id: { not: apt.id },
          },
        });

        if (existingToday) {
          // Patient already has a booking today with same doctor — cancel the stale one
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { status: 'CANCELLED' },
          });
          console.log(`  ✕ Appointment #${apt.id}: Patient already booked today, cancelled stale`);
          failed++;
          continue;
        }

        // If the appointment was PAID, reassign token number for today
        if (apt.paymentStatus === 'PAID') {
          const whereCount: any = {
            doctorId: apt.doctorId,
            appointmentDate: today,
            paymentStatus: 'PAID',
          };
          if (apt.shiftId) whereCount.shiftId = apt.shiftId;

          const paidCount = await prisma.appointment.count({ where: whereCount });
          const newToken = paidCount + 1;

          await prisma.appointment.update({
            where: { id: apt.id },
            data: {
              appointmentDate: today,
              tokenNumber: newToken,
            },
          });
        } else {
          // PENDING appointment — just move the date
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { appointmentDate: today },
          });
        }

        shifted++;
        console.log(`  ✓ Appointment #${apt.id}: Shifted from ${apt.appointmentDate} → ${today}`);
      } catch (err) {
        console.error(`  ✕ Appointment #${apt.id}: Failed to shift —`, (err as Error).message);
        failed++;
      }
    }

    console.log(`📅 Auto-shift complete: ${shifted} moved, ${failed} skipped/failed`);
  } catch (err) {
    console.error('Auto-shift error:', (err as Error).message);
  }
}

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    // ── AUTO-SHIFT: Move unviewed past appointments to today ──
    await autoShiftUnviewedAppointments();

    // Run auto-shift check every hour
    setInterval(autoShiftUnviewedAppointments, 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log('\n⚠️  Warning: Database connection failed');
    console.log('Error:', (error as Error).message);
    console.log('\n📝 To fix this:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Update DATABASE_URL in backend/.env with correct credentials');
    console.log('3. Run: npm run prisma:migrate');
    console.log('4. Run: npm run prisma:seed');
    console.log('\nStarting server anyway (API will fail without database)...\n');

    app.listen(PORT, () => {
      console.log(`⚠️  Server running on http://localhost:${PORT} (without database)`);
    });
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
  } catch (e) {
    // Database may not be connected
  }
  process.exit(0);
});

// Prevent crashes from unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

export default app;

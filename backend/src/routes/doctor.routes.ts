import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get today's queue for doctor
router.get(
  '/today-queue',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: today,
      },
      include: { patient: true },
      orderBy: { tokenNumber: 'asc' },
    });

    const stats = {
      total: appointments.length,
      booked: appointments.filter((a: any) => a.status === 'BOOKED').length,
      called: appointments.filter((a: any) => a.status === 'CALLED').length,
      pending: appointments.filter((a: any) => a.status === 'PENDING').length,
      completed: appointments.filter((a: any) => a.status === 'COMPLETED').length,
      skipped: appointments.filter((a: any) => a.status === 'SKIPPED').length,
    };

    // Build the serving queue order:
    // 1. Currently CALLED (being served)
    // 2. BOOKED (paid, waiting)
    // 3. SKIPPED (moved to end, will be re-called)
    // 4. COMPLETED (done)
    // 5. PENDING (not yet paid)
    const calledApts = appointments.filter((a: any) => a.status === 'CALLED');
    const bookedApts = appointments.filter((a: any) => a.status === 'BOOKED');
    const skippedApts = appointments.filter((a: any) => a.status === 'SKIPPED');
    const completedApts = appointments.filter((a: any) => a.status === 'COMPLETED');
    const pendingApts = appointments.filter((a: any) => a.status === 'PENDING');

    const orderedQueue = [...calledApts, ...bookedApts, ...skippedApts, ...completedApts, ...pendingApts];

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user?.name || 'Doctor',
        specialization: doctor.specialization,
        dailyTokenLimit: doctor.dailyTokenLimit,
      },
      appointments: orderedQueue,
      stats,
      date: today,
    });
  })
);

// Call next patient — auto picks the next BOOKED patient (or re-calls a SKIPPED one if no BOOKED left)
router.post(
  '/call-next',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

    // First, set any currently CALLED appointment back to BOOKED (shouldn't happen normally)
    await prisma.appointment.updateMany({
      where: { doctorId: doctor.id, appointmentDate: today, status: 'CALLED' },
      data: { status: 'BOOKED' },
    });

    // Find next BOOKED patient (by token order)
    let next = await prisma.appointment.findFirst({
      where: { doctorId: doctor.id, appointmentDate: today, status: 'BOOKED' },
      orderBy: { tokenNumber: 'asc' },
      include: { patient: true },
    });

    // If no BOOKED left, try SKIPPED patients
    if (!next) {
      next = await prisma.appointment.findFirst({
        where: { doctorId: doctor.id, appointmentDate: today, status: 'SKIPPED' },
        orderBy: { tokenNumber: 'asc' },
        include: { patient: true },
      });
    }

    if (!next) {
      return res.json({ success: true, message: 'No more patients in queue', appointment: null });
    }

    const called = await prisma.appointment.update({
      where: { id: next.id },
      data: { status: 'CALLED' },
      include: { patient: true },
    });

    res.json({ success: true, appointment: called });
  })
);

// Complete current appointment
router.post(
  '/appointments/:id/complete',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.doctorId !== doctor.id) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'COMPLETED' },
      include: { patient: true },
    });

    res.json({ success: true, appointment: updated });
  })
);

// Skip current appointment — moves patient down, next one comes up
router.post(
  '/appointments/:id/skip',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.doctorId !== doctor.id) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'SKIPPED' },
      include: { patient: true },
    });

    res.json({ success: true, appointment: updated });
  })
);

export default router;

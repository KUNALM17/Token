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
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get doctor record
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: today,
        status: { in: ['BOOKED', 'CALLED'] },
      },
      include: {
        patient: true,
      },
      orderBy: { tokenNumber: 'asc' },
    });

    const stats = {
      total: appointments.length,
      called: appointments.filter(a => a.status === 'CALLED').length,
      pending: appointments.filter(a => a.status === 'BOOKED').length,
    };

    res.json({
      doctor: {
        id: doctor.id,
        name: (req as any).user.name,
        specialization: doctor.specialization,
      },
      appointments,
      stats,
      date: today,
    });
  })
);

// Complete appointment (doctor perspective)
router.post(
  '/appointments/:id/complete',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id;

    // Verify this appointment belongs to this doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { doctor: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor || appointment.doctor.id !== doctor.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    res.json({ success: true, appointment: updated });
  })
);

export default router;

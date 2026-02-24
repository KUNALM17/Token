import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateCreateDoctor } from '../middleware/validation.js';

const router = Router();

// Create doctor
router.post(
  '/doctors',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  validateCreateDoctor,
  asyncHandler(async (req, res) => {
    const { userId, specialization, consultationFee, dailyTokenLimit } = req.body;
    const hospitalId = (req as any).user.hospitalId;

    // Verify user exists and belongs to same hospital
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.hospitalId !== hospitalId) {
      return res.status(403).json({ error: 'User does not belong to your hospital' });
    }

    // Check if doctor already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor already exists for this user' });
    }

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        userId,
        hospitalId,
        specialization,
        consultationFee,
        dailyTokenLimit,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json({ success: true, doctor });
  })
);

// Get doctors for hospital admin
router.get(
  '/doctors',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req, res) => {
    const hospitalId = (req as any).user.hospitalId;

    const doctors = await prisma.doctor.findMany({
      where: { hospitalId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ doctors });
  })
);

// Update doctor
router.put(
  '/doctors/:id',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req, res) => {
    const { specialization, consultationFee, dailyTokenLimit, isActive } = req.body;
    const hospitalId = (req as any).user.hospitalId;

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.hospitalId !== hospitalId) {
      return res.status(403).json({ error: 'Doctor does not belong to your hospital' });
    }

    const updated = await prisma.doctor.update({
      where: { id: req.params.id },
      data: {
        ...(specialization && { specialization }),
        ...(consultationFee && { consultationFee }),
        ...(dailyTokenLimit && { dailyTokenLimit }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: true,
      },
    });

    res.json({ success: true, doctor: updated });
  })
);

// Get today's appointments
router.get(
  '/appointments/today',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req, res) => {
    const hospitalId = (req as any).user.hospitalId;
    const today = new Date().toISOString().split('T')[0];

    const appointments = await prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: today,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    res.json({
      appointments,
      date: today,
      total: appointments.length,
    });
  })
);

// Call next appointment
router.post(
  '/appointments/:id/call-next',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CALLED' },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    res.json({ success: true, appointment: updated });
  })
);

// Skip appointment
router.post(
  '/appointments/:id/skip',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'SKIPPED' },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    res.json({ success: true, appointment: updated });
  })
);

// Complete appointment
router.post(
  '/appointments/:id/complete',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
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

// Export CSV
router.get(
  '/export/csv',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req, res) => {
    const hospitalId = (req as any).user.hospitalId;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const appointments = await prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: targetDate as string,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    // Generate CSV
    const headers = ['Token', 'Patient Name', 'Phone', 'Doctor', 'Status', 'Fee', 'Payment Status'];
    const rows = appointments.map(apt => [
      apt.tokenNumber,
      apt.patient.name || 'N/A',
      apt.patient.phone,
      apt.doctor.user.name || 'N/A',
      apt.status,
      apt.doctor.consultationFee,
      apt.paymentStatus,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="appointments_${targetDate}.csv"`);
    res.send(csv);
  })
);

export default router;

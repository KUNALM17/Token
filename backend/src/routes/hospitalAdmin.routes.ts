import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Create doctor (using phone number to find/create user)
router.post(
  '/doctors',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const { phone, name, specialization, consultationFee, dailyTokenLimit } = req.body;
    const hospitalId = req.user.hospitalId;

    if (!phone || !specialization || !consultationFee) {
      return res.status(400).json({ error: 'Phone, specialization, and consultation fee are required' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });

    if (user) {
      // Check if this user is already a doctor
      const existingDoctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (existingDoctor) {
        return res.status(400).json({ error: 'This phone number is already registered as a doctor' });
      }
      // Update user role to DOCTOR
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'DOCTOR', hospitalId, name: name || user.name },
      });
    } else {
      // Create new user as DOCTOR
      user = await prisma.user.create({
        data: {
          phone,
          name: name || null,
          role: 'DOCTOR',
          hospitalId,
        },
      });
    }

    // Create doctor profile
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        hospitalId,
        specialization,
        consultationFee: parseInt(consultationFee),
        dailyTokenLimit: parseInt(dailyTokenLimit) || 50,
      },
      include: { user: true },
    });

    res.status(201).json({ success: true, doctor });
  })
);

// Get doctors for hospital admin
router.get(
  '/doctors',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospitalId = req.user.hospitalId;

    const doctors = await prisma.doctor.findMany({
      where: { hospitalId },
      include: { user: true },
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
  asyncHandler(async (req: any, res: any) => {
    const { specialization, consultationFee, dailyTokenLimit, isActive } = req.body;
    const hospitalId = req.user.hospitalId;

    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.hospitalId !== hospitalId) {
      return res.status(403).json({ error: 'Doctor does not belong to your hospital' });
    }

    const updated = await prisma.doctor.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(specialization && { specialization }),
        ...(consultationFee !== undefined && { consultationFee: parseInt(consultationFee) }),
        ...(dailyTokenLimit !== undefined && { dailyTokenLimit: parseInt(dailyTokenLimit) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { user: true },
    });

    res.json({ success: true, doctor: updated });
  })
);

// Get today's appointments
router.get(
  '/appointments/today',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospitalId = req.user.hospitalId;
    const today = new Date().toISOString().split('T')[0];

    const appointments = await prisma.appointment.findMany({
      where: { hospitalId, appointmentDate: today },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    res.json({ appointments, date: today, total: appointments.length });
  })
);

// Call next appointment
router.post(
  '/appointments/:id/call-next',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospitalId = req.user.hospitalId;
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.hospitalId !== hospitalId) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'CALLED' },
      include: { patient: true, doctor: { include: { user: true } } },
    });

    res.json({ success: true, appointment: updated });
  })
);

// Skip appointment
router.post(
  '/appointments/:id/skip',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospitalId = req.user.hospitalId;
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.hospitalId !== hospitalId) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'SKIPPED' },
      include: { patient: true, doctor: { include: { user: true } } },
    });

    res.json({ success: true, appointment: updated });
  })
);

// Complete appointment
router.post(
  '/appointments/:id/complete',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospitalId = req.user.hospitalId;
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.hospitalId !== hospitalId) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'COMPLETED' },
      include: { patient: true, doctor: { include: { user: true } } },
    });

    res.json({ success: true, appointment: updated });
  })
);

// Export CSV
router.get(
  '/export/csv',
  authenticate,
  authorize('HOSPITAL_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospitalId = req.user.hospitalId;
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    const appointments = await prisma.appointment.findMany({
      where: { hospitalId, appointmentDate: targetDate },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    const headers = ['Token', 'Patient Name', 'Phone', 'Doctor', 'Specialization', 'Status', 'Fee', 'Payment Status'];
    const rows = appointments.map((apt: any) => [
      apt.tokenNumber ?? '',
      apt.patient?.name || 'N/A',
      apt.patient?.phone || 'N/A',
      apt.doctor?.user?.name || 'N/A',
      apt.doctor?.specialization || 'N/A',
      apt.status ?? '',
      apt.doctor?.consultationFee ?? '',
      apt.paymentStatus ?? '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="appointments_${targetDate}.csv"`);
    res.send(csv);
  })
);

export default router;

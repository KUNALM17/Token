import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBookAppointment, validateDateQuery } from '../middleware/validation.js';

const router = Router();

// Get all hospitals
router.get(
  '/hospitals',
  asyncHandler(async (req, res) => {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ hospitals });
  })
);

// Get doctors for hospital
router.get(
  '/hospitals/:id/doctors',
  asyncHandler(async (req, res) => {
    const doctors = await prisma.doctor.findMany({
      where: {
        hospitalId: req.params.id,
        isActive: true,
      },
      include: {
        user: true,
      },
      orderBy: { user: { name: 'asc' } },
    });

    res.json({ doctors });
  })
);

// Get doctor availability
router.get(
  '/doctors/:id/availability',
  validateDateQuery,
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Count appointments for this doctor on this date
    const appointmentCount = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: targetDate as string,
      },
    });

    const availableSlots = Math.max(0, doctor.dailyTokenLimit - appointmentCount);

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
        dailyTokenLimit: doctor.dailyTokenLimit,
      },
      date: targetDate,
      appointmentCount,
      availableSlots,
      isAvailable: availableSlots > 0,
    });
  })
);

// Book appointment
router.post(
  '/appointments/book',
  authenticate,
  validateBookAppointment,
  asyncHandler(async (req, res) => {
    const patientId = (req as any).user.id;
    const { doctorId, hospitalId, appointmentDate } = req.body;

    // Verify doctor exists and belongs to hospital
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.hospitalId !== hospitalId) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.isActive) {
      return res.status(400).json({ error: 'Doctor is not available' });
    }

    // Use transaction for concurrency safety
    try {
      const appointment = await prisma.$transaction(async (tx) => {
        // Count existing appointments for this doctor on this date
        const existingCount = await tx.appointment.count({
          where: {
            doctorId,
            appointmentDate,
          },
        });

        const nextToken = existingCount + 1;

        // Check if token exceeds limit
        if (nextToken > doctor.dailyTokenLimit) {
          throw new Error('No slots available for this doctor today');
        }

        // Create appointment
        const apt = await tx.appointment.create({
          data: {
            patientId,
            doctorId,
            hospitalId,
            appointmentDate,
            tokenNumber: nextToken,
            status: 'BOOKED',
            paymentStatus: 'PENDING',
          },
          include: {
            patient: true,
            doctor: { include: { user: true } },
          },
        });

        return apt;
      });

      res.status(201).json({
        success: true,
        appointment,
        message: 'Appointment booked. Please complete payment.',
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  })
);

// Get patient's appointments
router.get(
  '/appointments/my',
  authenticate,
  asyncHandler(async (req, res) => {
    const patientId = (req as any).user.id;

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: true } },
        hospital: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ appointments });
  })
);

// Get appointment status
router.get(
  '/appointments/:id/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        hospital: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check authorization
    if (appointment.patientId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ appointment });
  })
);

export default router;

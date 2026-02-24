import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get all hospitals (public)
router.get(
  '/hospitals',
  asyncHandler(async (req: any, res: any) => {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ hospitals });
  })
);

// Get doctors for hospital (public)
router.get(
  '/hospitals/:id/doctors',
  asyncHandler(async (req: any, res: any) => {
    const doctors = await prisma.doctor.findMany({
      where: {
        hospitalId: parseInt(req.params.id),
        isActive: true,
      },
      include: { user: true },
    });

    // Map to a cleaner response
    const mapped = doctors.map((d: any) => ({
      id: d.id,
      name: d.user?.name || 'Doctor',
      specialization: d.specialization,
      consultationFee: d.consultationFee,
      dailyTokenLimit: d.dailyTokenLimit,
      isActive: d.isActive,
    }));

    res.json({ doctors: mapped });
  })
);

// Get doctor availability (public)
router.get(
  '/doctors/:id/availability',
  asyncHandler(async (req: any, res: any) => {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const appointmentCount = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: targetDate,
      },
    });

    const limit = doctor.dailyTokenLimit ?? 50;
    const availableSlots = Math.max(0, limit - appointmentCount);

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user?.name || 'Doctor',
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
        dailyTokenLimit: limit,
      },
      date: targetDate,
      appointmentCount,
      availableSlots,
      isAvailable: availableSlots > 0,
    });
  })
);

// Book appointment (requires auth)
router.post(
  '/appointments/book',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const patientId = req.user.id;
    const { doctorId, hospitalId, appointmentDate } = req.body;

    if (!doctorId || !hospitalId || !appointmentDate) {
      return res.status(400).json({ error: 'doctorId, hospitalId, and appointmentDate are required' });
    }

    // Verify doctor exists and belongs to hospital
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(doctorId) },
    });

    if (!doctor || doctor.hospitalId !== parseInt(hospitalId)) {
      return res.status(404).json({ error: 'Doctor not found in this hospital' });
    }

    if (!doctor.isActive) {
      return res.status(400).json({ error: 'Doctor is not available' });
    }

    const limit = doctor.dailyTokenLimit ?? 50;

    // Use transaction for concurrency safety
    try {
      const appointment = await prisma.$transaction(async (tx: any) => {
        const existingCount = await tx.appointment.count({
          where: {
            doctorId: parseInt(doctorId),
            appointmentDate,
          },
        });

        const nextToken = existingCount + 1;

        if (nextToken > limit) {
          throw new Error(`No slots available. All ${limit} tokens are booked for this doctor today.`);
        }

        const apt = await tx.appointment.create({
          data: {
            patientId,
            doctorId: parseInt(doctorId),
            hospitalId: parseInt(hospitalId),
            appointmentDate,
            tokenNumber: nextToken,
            status: 'PENDING',
            paymentStatus: 'PENDING',
          },
          include: {
            patient: true,
            doctor: { include: { user: true } },
            hospital: true,
          },
        });

        return apt;
      });

      res.status(201).json({
        success: true,
        appointment: {
          ...appointment,
          doctorName: (appointment as any).doctor?.user?.name || 'Doctor',
          hospitalName: (appointment as any).hospital?.name || '',
        },
        message: `Token #${(appointment as any).tokenNumber} booked successfully!`,
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
  asyncHandler(async (req: any, res: any) => {
    const patientId = req.user.id;

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
  asyncHandler(async (req: any, res: any) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        hospital: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ appointment });
  })
);

export default router;

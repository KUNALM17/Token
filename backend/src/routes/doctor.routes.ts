import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/today-queue', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    include: { shifts: { where: { isActive: true }, orderBy: { startTime: 'asc' } } },
  });
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

  const shiftId = req.query.shiftId ? parseInt(req.query.shiftId) : undefined;
  const whereClause: any = {
    doctorId: doctor.id,
    appointmentDate: today,
    paymentStatus: 'PAID',
    status: { not: 'CANCELLED' },
  };
  if (shiftId) whereClause.shiftId = shiftId;

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: { patient: true, shift: true },
    orderBy: { tokenNumber: 'asc' },
  });

  const statusOrder: Record<string, number> = { CALLED: 0, BOOKED: 1, SKIPPED: 2, COMPLETED: 3 };
  appointments.sort((a: any, b: any) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const stats = {
    total: appointments.length,
    booked: appointments.filter((a: any) => a.status === 'BOOKED').length,
    called: appointments.filter((a: any) => a.status === 'CALLED').length,
    completed: appointments.filter((a: any) => a.status === 'COMPLETED').length,
    skipped: appointments.filter((a: any) => a.status === 'SKIPPED').length,
  };

  const currentToken = appointments.find((a: any) => a.status === 'CALLED')?.tokenNumber || null;

  res.json({
    doctor: {
      id: doctor.id,
      name: req.user.name || 'Doctor',
      specialization: doctor.specialization,
      avgConsultTime: (doctor as any).avgConsultTime ?? 5,
    },
    shifts: doctor.shifts,
    appointments, stats, currentToken, date: today,
  });
}));

// Update doctor settings (avgConsultTime)
router.patch('/settings', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const { avgConsultTime } = req.body;
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const updated = await prisma.doctor.update({
    where: { id: doctor.id },
    data: { avgConsultTime: Math.max(1, Math.min(60, parseInt(avgConsultTime) || 5)) } as any,
  });
  res.json({ success: true, avgConsultTime: (updated as any).avgConsultTime });
}));

router.post('/call-next', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const shiftId = req.body.shiftId ? parseInt(req.body.shiftId) : undefined;
  const whereBase: any = { doctorId: doctor.id, appointmentDate: today, paymentStatus: 'PAID' };
  if (shiftId) whereBase.shiftId = shiftId;

  // Mark any currently CALLED patient as auto-completed first
  await prisma.appointment.updateMany({
    where: { ...whereBase, status: 'CALLED' },
    data: { status: 'COMPLETED' },
  });

  const next = await prisma.appointment.findFirst({
    where: { ...whereBase, status: 'BOOKED' },
    orderBy: { tokenNumber: 'asc' },
  });
  if (!next) return res.status(404).json({ error: 'No more patients waiting' });

  const updated = await prisma.appointment.update({
    where: { id: next.id },
    data: { status: 'CALLED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

router.post('/appointments/:id/complete', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const updated = await prisma.appointment.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'COMPLETED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

router.post('/appointments/:id/skip', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const updated = await prisma.appointment.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'SKIPPED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

router.post('/appointments/:id/unskip', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const apt = await prisma.appointment.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  if (apt.status !== 'SKIPPED') return res.status(400).json({ error: 'Only skipped appointments can be unskipped' });

  const updated = await prisma.appointment.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'BOOKED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

router.get('/live-status/:doctorId', asyncHandler(async (req: any, res: any) => {
  const today = new Date().toISOString().split('T')[0];
  const doctorId = parseInt(req.params.doctorId);
  const shiftId = req.query.shiftId ? parseInt(req.query.shiftId) : undefined;
  const patientId = req.query.patientId ? parseInt(req.query.patientId) : undefined;

  // Fetch doctor to get avgConsultTime
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  const avgTime = (doctor as any)?.avgConsultTime ?? 5;

  const whereClause: any = { doctorId, appointmentDate: today, paymentStatus: 'PAID' };
  if (shiftId) whereClause.shiftId = shiftId;

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    select: { id: true, tokenNumber: true, status: true, patientId: true, shiftId: true },
    orderBy: { tokenNumber: 'asc' },
  });

  const currentlyServing = appointments.find((a: any) => a.status === 'CALLED');
  const completed = appointments.filter((a: any) => a.status === 'COMPLETED').length;
  const total = appointments.length;
  const booked = appointments.filter((a: any) => a.status === 'BOOKED').length;

  let tokensAhead: number | undefined;
  let patientStatus: string | undefined;
  let patientToken: number | undefined;
  let estimatedWait: string | undefined;

  if (patientId) {
    const myAppt = appointments.find(a => a.patientId === patientId);
    if (myAppt) {
      patientStatus = myAppt.status!;
      patientToken = myAppt.tokenNumber!;
      if (myAppt.status === 'BOOKED') {
        const aheadCount = appointments.filter(
          a => a.status === 'BOOKED' && (a.tokenNumber || 0) < (myAppt.tokenNumber || 0)
        ).length;
        tokensAhead = currentlyServing ? aheadCount + 1 : aheadCount;
      } else if (myAppt.status === 'CALLED') {
        tokensAhead = 0;
      }
    }
  }

  // Estimated wait uses doctor's configured avgConsultTime
  if (tokensAhead !== undefined && tokensAhead > 0) {
    const totalMin = tokensAhead * avgTime;
    estimatedWait = totalMin >= 60 ? `~${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `~${totalMin} min`;
  } else if (tokensAhead === 0) {
    estimatedWait = 'Your turn now!';
  }

  res.json({
    currentToken: currentlyServing?.tokenNumber || null,
    completedCount: completed,
    totalBooked: total,
    waitingCount: booked,
    tokensAhead,
    patientStatus,
    patientToken,
    estimatedWait,
    avgConsultTime: avgTime,
    appointments: appointments.map((a: any) => ({
      id: a.id, tokenNumber: a.tokenNumber, status: a.status, patientId: a.patientId,
    })),
  });
}));

// Backwards-compatible PATCH endpoints used by frontend (complete/skip/unskip/call-next)
router.patch('/call-next', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const shiftId = req.body.shiftId ? parseInt(req.body.shiftId) : undefined;
  const whereBase: any = { doctorId: doctor.id, appointmentDate: today, paymentStatus: 'PAID' };
  if (shiftId) whereBase.shiftId = shiftId;

  // Auto-complete currently CALLED patient
  await prisma.appointment.updateMany({
    where: { ...whereBase, status: 'CALLED' },
    data: { status: 'COMPLETED' },
  });

  const next = await prisma.appointment.findFirst({
    where: { ...whereBase, status: 'BOOKED' },
    orderBy: { tokenNumber: 'asc' },
  });
  if (!next) return res.status(404).json({ error: 'No more patients waiting' });

  const updated = await prisma.appointment.update({
    where: { id: next.id },
    data: { status: 'CALLED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

router.patch('/complete/:id', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const updated = await prisma.appointment.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'COMPLETED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

router.patch('/skip/:id', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const updated = await prisma.appointment.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'SKIPPED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

router.patch('/unskip/:id', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const apt = await prisma.appointment.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  if (apt.status !== 'SKIPPED') return res.status(400).json({ error: 'Only skipped appointments can be unskipped' });

  const updated = await prisma.appointment.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'BOOKED' },
    include: { patient: true },
  });
  res.json({ success: true, appointment: updated });
}));

// ── DOCTOR SAME-DAY UNAVAILABILITY (Feature 3) ──
// Doctor can mark themselves unavailable for today or a future date
router.post('/mark-leave', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

  const { leaveDate, shiftId, reason } = req.body;
  const targetDate = leaveDate || new Date().toISOString().split('T')[0];
  const sId = shiftId ? parseInt(shiftId) : null;

  // Check if leave already exists
  const existing = await prisma.doctorLeave.findFirst({
    where: { doctorId: doctor.id, leaveDate: targetDate, shiftId: sId },
  });
  if (existing) return res.status(400).json({ error: 'Leave already marked for this date/shift' });

  const leave = await prisma.doctorLeave.create({
    data: {
      doctorId: doctor.id,
      leaveDate: targetDate,
      shiftId: sId,
      reason: reason || 'Doctor unavailable',
      createdBy: 'DOCTOR',
    },
    include: { shift: true },
  });

  // Count affected appointments
  const where: any = { doctorId: doctor.id, appointmentDate: targetDate, status: { in: ['BOOKED', 'PENDING'] } };
  if (sId) where.shiftId = sId;
  const affected = await prisma.appointment.count({ where });

  res.status(201).json({
    success: true,
    leave,
    affectedAppointments: affected,
    message: affected > 0
      ? `Leave marked. ${affected} patient(s) will need to reschedule.`
      : 'Leave marked. No patients affected.',
  });
}));

// Get my leaves
router.get('/my-leaves', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

  const today = new Date().toISOString().split('T')[0];
  const leaves = await prisma.doctorLeave.findMany({
    where: { doctorId: doctor.id, leaveDate: { gte: today } },
    include: { shift: true },
    orderBy: { leaveDate: 'asc' },
  });
  res.json({ leaves });
}));

// Cancel a leave I created
router.delete('/leaves/:id', authenticate, authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
  const userId = req.user.id;
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

  const leave = await prisma.doctorLeave.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  if (leave.doctorId !== doctor.id) return res.status(403).json({ error: 'Not your leave' });

  await prisma.doctorLeave.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
}));

export default router;

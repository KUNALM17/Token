import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/doctors', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { phone, name, specialization, consultationFee } = req.body;
  const hospitalId = req.user.hospitalId;
  if (!phone || !specialization) return res.status(400).json({ error: 'Phone and specialization required' });
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });

  let user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  if (!user) {
    user = await prisma.user.create({ data: { phone: cleanPhone, name: name || null, role: 'DOCTOR', hospitalId } });
  } else {
    user = await prisma.user.update({ where: { phone: cleanPhone }, data: { role: 'DOCTOR', hospitalId, name: name || user.name } });
  }

  const existing = await prisma.doctor.findUnique({ where: { userId: user.id } });
  if (existing) return res.status(400).json({ error: 'Doctor profile already exists' });

  const doctor = await prisma.doctor.create({
    data: { userId: user.id, hospitalId, specialization, consultationFee: consultationFee || 500 },
    include: { user: true },
  });
  res.status(201).json({ success: true, doctor });
}));

router.get('/doctors', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const hospitalId = req.user.hospitalId;
  const doctors = await prisma.doctor.findMany({
    where: { hospitalId },
    include: { user: true, shifts: { where: { isActive: true }, orderBy: { startTime: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(doctors);
}));

router.patch('/doctors/:id', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { specialization, consultationFee, isActive, name } = req.body;
  const doctorId = parseInt(req.params.id);

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  if (doctor.hospitalId !== req.user.hospitalId) return res.status(403).json({ error: 'Not your hospital' });

  // Update doctor fields
  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      ...(specialization !== undefined && { specialization }),
      ...(consultationFee !== undefined && { consultationFee }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { user: true },
  });

  // Update name on the User record if provided
  if (name !== undefined && updated.userId) {
    await prisma.user.update({
      where: { id: updated.userId },
      data: { name },
    });
    (updated as any).user.name = name;
  }

  res.json({ success: true, doctor: updated });
}));

// --- SHIFT MANAGEMENT ---
router.post('/doctors/:doctorId/shifts', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { shiftName, startTime, endTime, tokenLimit } = req.body;
  const doctorId = parseInt(req.params.doctorId);
  if (!shiftName || !startTime || !endTime) return res.status(400).json({ error: 'shiftName, startTime, endTime required' });

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  if (doctor.hospitalId !== req.user.hospitalId) return res.status(403).json({ error: 'Not your hospital' });

  const shift = await prisma.doctorShift.create({
    data: { doctorId, shiftName, startTime, endTime, tokenLimit: tokenLimit || 20 },
  });
  res.status(201).json({ success: true, shift });
}));

router.get('/doctors/:doctorId/shifts', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const shifts = await prisma.doctorShift.findMany({
    where: { doctorId: parseInt(req.params.doctorId) },
    orderBy: { startTime: 'asc' },
  });
  res.json({ shifts });
}));

router.patch('/shifts/:id', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { shiftName, startTime, endTime, tokenLimit, isActive } = req.body;
  const updated = await prisma.doctorShift.update({
    where: { id: parseInt(req.params.id) },
    data: {
      ...(shiftName !== undefined && { shiftName }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(tokenLimit !== undefined && { tokenLimit }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  res.json({ success: true, shift: updated });
}));

router.delete('/shifts/:id', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  await prisma.doctorShift.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
}));

// ── ALL APPOINTMENTS (with filters) ──
router.get('/appointments', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const hospitalId = req.user.hospitalId;
  const doctorId = req.query.doctorId ? parseInt(req.query.doctorId) : undefined;
  const date = req.query.date as string || undefined;
  const status = req.query.status as string || undefined;

  const where: any = { hospitalId };
  if (doctorId) where.doctorId = doctorId;
  if (date) where.appointmentDate = date;
  if (status && status !== 'ALL') where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      doctor: { include: { user: true } },
      shift: true,
    },
    orderBy: [{ appointmentDate: 'desc' }, { tokenNumber: 'asc' }],
  });

  // Summary stats
  const total = appointments.length;
  const completed = appointments.filter((a: any) => a.status === 'COMPLETED').length;
  const booked = appointments.filter((a: any) => a.status === 'BOOKED').length;
  const called = appointments.filter((a: any) => a.status === 'CALLED').length;
  const skipped = appointments.filter((a: any) => a.status === 'SKIPPED').length;
  const cancelled = appointments.filter((a: any) => a.status === 'CANCELLED').length;
  const pending = appointments.filter((a: any) => a.status === 'PENDING').length;
  const totalRevenue = appointments.filter((a: any) => a.paymentStatus === 'PAID')
    .reduce((sum: number, a: any) => sum + (a.doctor?.consultationFee || 0), 0);

  res.json({
    appointments,
    stats: { total, completed, booked, called, skipped, cancelled, pending, totalRevenue },
  });
}));

// ── CSV EXPORT ──
router.get('/appointments/export', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const hospitalId = req.user.hospitalId;
  const doctorId = req.query.doctorId ? parseInt(req.query.doctorId) : undefined;
  const date = req.query.date as string || undefined;
  const status = req.query.status as string || undefined;

  const where: any = { hospitalId };
  if (doctorId) where.doctorId = doctorId;
  if (date) where.appointmentDate = date;
  if (status && status !== 'ALL') where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      doctor: { include: { user: true } },
      shift: true,
    },
    orderBy: [{ appointmentDate: 'desc' }, { tokenNumber: 'asc' }],
  });

  const headers = ['Date', 'Token#', 'Patient Name', 'Patient Phone', 'Doctor', 'Specialization', 'Shift', 'Status', 'Payment Status', 'Fee'];
  const rows = appointments.map((a: any) => [
    a.appointmentDate || '-',
    a.tokenNumber || 0,
    a.patient?.name || '-',
    a.patient?.phone || '-',
    a.doctor?.user?.name ? `Dr. ${a.doctor.user.name}` : '-',
    a.doctor?.specialization || '-',
    a.shift?.shiftName || '-',
    a.status || '-',
    a.paymentStatus || '-',
    a.doctor?.consultationFee || 0,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const filename = `appointments${date ? `_${date}` : ''}_${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}));

// ── PER-DOCTOR (legacy, kept for compatibility) ──
router.get('/doctors/:doctorId/appointments', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const appointments = await prisma.appointment.findMany({
    where: { doctorId: parseInt(req.params.doctorId), appointmentDate: date },
    include: { patient: true, shift: true },
    orderBy: { tokenNumber: 'asc' },
  });
  res.json(appointments);
}));

// ── DELETE APPOINTMENTS (bulk) ──
// Delete all hospital appointments (with optional doctorId + date filters)
router.delete('/appointments', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const hospitalId = req.user.hospitalId;
  const doctorId = req.query.doctorId ? parseInt(req.query.doctorId) : undefined;
  const date = req.query.date as string || undefined;

  const where: any = { hospitalId };
  if (doctorId) where.doctorId = doctorId;
  if (date) where.appointmentDate = date;

  // First delete related payments
  const apptIds = (await prisma.appointment.findMany({ where, select: { id: true } })).map((a: any) => a.id);
  if (apptIds.length > 0) {
    await prisma.payment.deleteMany({ where: { appointmentId: { in: apptIds } } });
  }
  const result = await prisma.appointment.deleteMany({ where });
  res.json({ success: true, deleted: result.count });
}));

// Delete a single appointment
router.delete('/appointments/:id', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  if (appointment.hospitalId !== req.user.hospitalId) return res.status(403).json({ error: 'Not your hospital' });

  await prisma.payment.deleteMany({ where: { appointmentId: id } });
  await prisma.appointment.delete({ where: { id } });
  res.json({ success: true });
}));

// ── PATIENT / USER MANAGEMENT ──
// List all patients who have appointments in this hospital
router.get('/patients', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const hospitalId = req.user.hospitalId;
  const search = req.query.search as string || '';

  // Get unique patient IDs from appointments
  const patientIds = (await prisma.appointment.findMany({
    where: { hospitalId },
    select: { patientId: true },
    distinct: ['patientId'],
  })).map((a: any) => a.patientId);

  const where: any = {
    OR: [
      { id: { in: patientIds } },
      { hospitalId, role: 'PATIENT' },
    ],
  };

  if (search) {
    where.AND = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    };
  }

  const patients = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, phone: true, name: true, age: true, gender: true, weight: true, city: true, role: true, isActive: true, createdAt: true },
  });
  res.json({ patients });
}));

// Create a patient
router.post('/patients', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { phone, name, age, gender, weight, city } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) return res.status(400).json({ error: 'Phone must be 10 digits' });

  let user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  if (user) return res.status(400).json({ error: 'User with this phone already exists' });

  user = await prisma.user.create({
    data: {
      phone: cleanPhone,
      name: name || null,
      role: 'PATIENT',
      age: age ? parseInt(age) : null,
      gender: gender || null,
      weight: weight ? parseInt(weight) : null,
      city: city || null,
    },
  });
  res.status(201).json({ success: true, patient: user });
}));

// Update a patient
router.patch('/patients/:id', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { name, age, gender, weight, city, phone } = req.body;
  const id = parseInt(req.params.id);
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (age !== undefined) data.age = age ? parseInt(age) : null;
  if (gender !== undefined) data.gender = gender;
  if (weight !== undefined) data.weight = weight ? parseInt(weight) : null;
  if (city !== undefined) data.city = city;
  if (phone !== undefined) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) return res.status(400).json({ error: 'Phone must be 10 digits' });
    const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existing && existing.id !== id) return res.status(400).json({ error: 'Phone number already in use' });
    data.phone = cleanPhone;
  }

  const updated = await prisma.user.update({ where: { id }, data });
  res.json({ success: true, patient: updated });
}));

// Delete a patient (and their appointments in this hospital)
router.delete('/patients/:id', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const hospitalId = req.user.hospitalId;

  // Delete their appointments + payments in this hospital
  const apptIds = (await prisma.appointment.findMany({
    where: { patientId: id, hospitalId },
    select: { id: true },
  })).map((a: any) => a.id);
  if (apptIds.length > 0) {
    await prisma.payment.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.appointment.deleteMany({ where: { id: { in: apptIds } } });
  }

  // Check if patient has appointments in other hospitals
  const otherAppts = await prisma.appointment.count({ where: { patientId: id } });
  if (otherAppts === 0) {
    // Safe to delete the user entirely
    await prisma.oTP.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, deleted: 'user' });
  } else {
    res.json({ success: true, deleted: 'hospital-data-only', message: 'Patient has data in other hospitals, only this hospital\'s data was removed' });
  }
}));

// ═══════════════════════════════════════════
// ── DOCTOR LEAVE MANAGEMENT (Feature 2 & 3) ──
// ═══════════════════════════════════════════

// List leaves for a doctor
router.get('/doctors/:doctorId/leaves', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const doctorId = parseInt(req.params.doctorId);
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.hospitalId !== req.user.hospitalId) return res.status(403).json({ error: 'Not your hospital' });

  const today = new Date().toISOString().split('T')[0];
  const leaves = await prisma.doctorLeave.findMany({
    where: { doctorId, leaveDate: { gte: today } },
    include: { shift: true },
    orderBy: { leaveDate: 'asc' },
  });
  res.json({ leaves });
}));

// Add a leave (full day or shift-specific)
router.post('/doctors/:doctorId/leaves', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const doctorId = parseInt(req.params.doctorId);
  const { leaveDate, shiftId, reason } = req.body;
  if (!leaveDate) return res.status(400).json({ error: 'leaveDate is required (YYYY-MM-DD)' });

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.hospitalId !== req.user.hospitalId) return res.status(403).json({ error: 'Not your hospital' });

  const sId = shiftId ? parseInt(shiftId) : null;

  // Check for duplicate
  const existing = await prisma.doctorLeave.findFirst({
    where: { doctorId, leaveDate, shiftId: sId },
  });
  if (existing) return res.status(400).json({ error: 'Leave already exists for this date/shift' });

  const leave = await prisma.doctorLeave.create({
    data: {
      doctorId,
      leaveDate,
      shiftId: sId,
      reason: reason || null,
      createdBy: 'ADMIN',
    },
    include: { shift: true },
  });

  // Count affected appointments (BOOKED/PENDING on that date)
  const where: any = { doctorId, appointmentDate: leaveDate, status: { in: ['BOOKED', 'PENDING'] } };
  if (sId) where.shiftId = sId;
  const affected = await prisma.appointment.count({ where });

  res.status(201).json({
    success: true,
    leave,
    affectedAppointments: affected,
    message: affected > 0
      ? `Leave added. ${affected} patient(s) will be notified to reschedule.`
      : 'Leave added. No patients affected.',
  });
}));

// Remove a leave
router.delete('/leaves/:id', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const leave = await prisma.doctorLeave.findUnique({ where: { id }, include: { doctor: true } });
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  if ((leave as any).doctor.hospitalId !== req.user.hospitalId) return res.status(403).json({ error: 'Not your hospital' });

  await prisma.doctorLeave.delete({ where: { id } });
  res.json({ success: true });
}));

// ═══════════════════════════════════════════
// ── BOOKING SETTINGS (Feature 4) ──
// ═══════════════════════════════════════════

// Get hospital settings
router.get('/settings', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const hospital = await prisma.hospital.findUnique({ where: { id: req.user.hospitalId } });
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  res.json({
    maxBookingDaysAhead: (hospital as any).maxBookingDaysAhead ?? 7,
    name: hospital.name,
    address: hospital.address,
    city: hospital.city,
    state: hospital.state,
    phone: hospital.phone,
  });
}));

// Update booking horizon
router.patch('/settings', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { maxBookingDaysAhead } = req.body;
  if (maxBookingDaysAhead === undefined) return res.status(400).json({ error: 'maxBookingDaysAhead is required' });
  const days = parseInt(maxBookingDaysAhead);
  if (isNaN(days) || days < 0 || days > 30) return res.status(400).json({ error: 'maxBookingDaysAhead must be 0-30' });

  const hospital = await prisma.hospital.update({
    where: { id: req.user.hospitalId },
    data: { maxBookingDaysAhead: days } as any,
  });
  res.json({ success: true, maxBookingDaysAhead: (hospital as any).maxBookingDaysAhead });
}));

// ═══════════════════════════════════════════
// ── WORKING DAYS PER SHIFT (Feature 5) ──
// ═══════════════════════════════════════════

// Update working days for a shift
router.patch('/shifts/:id/working-days', authenticate, authorize('HOSPITAL_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { workingDays } = req.body;
  if (!workingDays) return res.status(400).json({ error: 'workingDays is required (comma-separated: 0=Sun,1=Mon...6=Sat)' });

  // Validate format
  const days = workingDays.split(',').map(Number);
  if (days.some((d: number) => isNaN(d) || d < 0 || d > 6)) {
    return res.status(400).json({ error: 'Invalid working days. Use 0-6 (0=Sunday, 6=Saturday)' });
  }

  const shift = await prisma.doctorShift.findUnique({ where: { id: parseInt(req.params.id) }, include: { doctor: true } });
  if (!shift) return res.status(404).json({ error: 'Shift not found' });
  if ((shift as any).doctor.hospitalId !== req.user.hospitalId) return res.status(403).json({ error: 'Not your hospital' });

  const updated = await prisma.doctorShift.update({
    where: { id: parseInt(req.params.id) },
    data: { workingDays } as any,
  });
  res.json({ success: true, shift: updated });
}));

export default router;

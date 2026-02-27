import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// ── Helper: check if a date is a working day for a shift ──
function isWorkingDay(shift: any, dateStr: string): boolean {
  const workingDays = (shift.workingDays || '1,2,3,4,5').split(',').map(Number);
  const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay(); // 0=Sun, 1=Mon...6=Sat
  return workingDays.includes(dayOfWeek);
}

// ── Helper: check if doctor is on leave for a date (optionally shift-specific) ──
async function isDoctorOnLeave(doctorId: number, dateStr: string, shiftId?: number | null): Promise<boolean> {
  const leaves = await prisma.doctorLeave.findMany({
    where: { doctorId, leaveDate: dateStr },
  });
  if (leaves.length === 0) return false;
  if (leaves.some((l: any) => l.shiftId === null)) return true;
  if (shiftId && leaves.some((l: any) => l.shiftId === shiftId)) return true;
  return false;
}

router.get('/hospitals', asyncHandler(async (req: any, res: any) => {
  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ hospitals });
}));

router.get('/hospitals/:id/doctors', asyncHandler(async (req: any, res: any) => {
  const doctors = await prisma.doctor.findMany({
    where: { hospitalId: parseInt(req.params.id), isActive: true },
    include: { user: true, shifts: { where: { isActive: true }, orderBy: { startTime: 'asc' } } },
  });
  res.json({ doctors });
}));

// ── AVAILABILITY ──
// Respects: working days, doctor leave, booking horizon
router.get('/doctors/:id/availability', asyncHandler(async (req: any, res: any) => {
  const { date, shiftId } = req.query;
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];
  const doctor = await prisma.doctor.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      user: true,
      hospital: true,
      shifts: { where: { isActive: true }, orderBy: { startTime: 'asc' } },
    },
  });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  // Check booking horizon
  const maxDays = (doctor as any).hospital?.maxBookingDaysAhead ?? 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate + 'T00:00:00');
  const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return res.status(400).json({ error: 'Cannot book for past dates' });
  if (diffDays > maxDays) return res.status(400).json({ error: `Booking is only allowed up to ${maxDays} day(s) ahead` });

  const onLeave = await isDoctorOnLeave(doctor.id, targetDate);

  if (shiftId) {
    const sid = parseInt(shiftId as string);
    const shift = (doctor as any).shifts?.find((s: any) => s.id === sid);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    const shiftOnLeave = await isDoctorOnLeave(doctor.id, targetDate, sid);
    const isWorking = isWorkingDay(shift, targetDate);

    const appointmentCount = await prisma.appointment.count({
      where: { doctorId: doctor.id, appointmentDate: targetDate, shiftId: sid, status: { not: 'CANCELLED' } },
    });

    return res.json({
      doctor: { id: doctor.id, name: (doctor as any).user?.name, specialization: doctor.specialization, consultationFee: doctor.consultationFee },
      shift: { ...shift, workingDays: shift.workingDays },
      date: targetDate, appointmentCount,
      availableSlots: (shiftOnLeave || !isWorking) ? 0 : Math.max(0, shift.tokenLimit - appointmentCount),
      isAvailable: !shiftOnLeave && isWorking && appointmentCount < shift.tokenLimit,
      onLeave: shiftOnLeave,
      notWorkingDay: !isWorking,
      maxBookingDaysAhead: maxDays,
    });
  }

  // Check if shift has ended for today
  const nowTime = new Date();
  const currentHHMM = `${String(nowTime.getHours()).padStart(2,'0')}:${String(nowTime.getMinutes()).padStart(2,'0')}`;
  const isToday = targetDate === new Date().toISOString().split('T')[0];

  const shifts = (doctor as any).shifts || [];
  const shiftsWithAvailability = await Promise.all(shifts.map(async (shift: any) => {
    const shiftOnLeave = await isDoctorOnLeave(doctor.id, targetDate, shift.id);
    const isWorking = isWorkingDay(shift, targetDate);
    const shiftEnded = isToday && currentHHMM >= shift.endTime;
    const count = await prisma.appointment.count({
      where: { doctorId: doctor.id, appointmentDate: targetDate, shiftId: shift.id, status: { not: 'CANCELLED' } },
    });
    return {
      ...shift,
      workingDays: shift.workingDays,
      appointmentCount: count,
      availableSlots: (shiftOnLeave || !isWorking || shiftEnded) ? 0 : Math.max(0, shift.tokenLimit - count),
      isAvailable: !shiftOnLeave && isWorking && !shiftEnded && count < shift.tokenLimit,
      onLeave: shiftOnLeave,
      notWorkingDay: !isWorking,
      shiftEnded,
    };
  }));

  const totalCount = await prisma.appointment.count({
    where: { doctorId: doctor.id, appointmentDate: targetDate, status: { not: 'CANCELLED' } },
  });

  res.json({
    doctor: { id: doctor.id, name: (doctor as any).user?.name, specialization: doctor.specialization, consultationFee: doctor.consultationFee },
    date: targetDate, shifts: shiftsWithAvailability, totalAppointments: totalCount, hasShifts: shifts.length > 0,
    onLeave,
    maxBookingDaysAhead: maxDays,
  });
}));

// ── BOOKING ──
// Checks: working days, doctor leave, booking horizon
router.post('/appointments/book', authenticate, asyncHandler(async (req: any, res: any) => {
  const patientId = req.user.id;
  const { doctorId, hospitalId, appointmentDate, shiftId } = req.body;
  if (!doctorId || !hospitalId || !appointmentDate) return res.status(400).json({ error: 'doctorId, hospitalId, appointmentDate required' });

  const dId = parseInt(doctorId);
  const hId = parseInt(hospitalId);
  const sId = shiftId ? parseInt(shiftId) : null;

  const doctor = await prisma.doctor.findUnique({
    where: { id: dId },
    include: { user: true, hospital: true },
  });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  // Feature 4: Check booking horizon
  const maxDays = (doctor as any).hospital?.maxBookingDaysAhead ?? 7;
  const todayD = new Date();
  todayD.setHours(0, 0, 0, 0);
  const targetD = new Date(appointmentDate + 'T00:00:00');
  const diffDays = Math.floor((targetD.getTime() - todayD.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return res.status(400).json({ error: 'Cannot book for past dates' });
  if (diffDays > maxDays) {
    return res.status(400).json({ error: `Booking is only allowed up to ${maxDays} day(s) ahead. Please select a closer date.` });
  }

  // Feature 2 & 3: Check doctor leave
  const onLeave = await isDoctorOnLeave(dId, appointmentDate, sId);
  if (onLeave) {
    return res.status(400).json({ error: 'Doctor is not available on this date. They are on leave.' });
  }

  // Feature 5: Check working days
  if (sId) {
    const shift = await prisma.doctorShift.findUnique({ where: { id: sId } });
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    // Check if shift has ended for today
    const nowBooking = new Date();
    const bookHHMM = `${String(nowBooking.getHours()).padStart(2,'0')}:${String(nowBooking.getMinutes()).padStart(2,'0')}`;
    const isTodayBooking = appointmentDate === new Date().toISOString().split('T')[0];
    if (isTodayBooking && bookHHMM >= shift.endTime) {
      return res.status(400).json({ error: `This shift (${shift.shiftName}) has already ended for today. Please pick another shift or date.` });
    }

    if (!isWorkingDay(shift, appointmentDate)) {
      const dayName = new Date(appointmentDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long' });
      return res.status(400).json({ error: `Doctor does not work on ${dayName}s for this shift. Please pick another date.` });
    }

    const totalBooked = await prisma.appointment.count({
      where: { doctorId: dId, appointmentDate, shiftId: sId, status: { not: 'CANCELLED' } },
    });
    if (totalBooked >= shift.tokenLimit) return res.status(400).json({ error: 'No slots available for this shift' });
  }

  const existingBooking = await prisma.appointment.findFirst({
    where: { patientId, doctorId: dId, appointmentDate, status: { not: 'CANCELLED' } },
  });
  if (existingBooking) return res.status(400).json({ error: 'You already have an appointment with this doctor today. Only one booking per doctor per day is allowed.' });

  const pendingCount = await prisma.appointment.count({
    where: { doctorId: dId, appointmentDate, status: 'PENDING' },
  });

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId: dId,
      hospitalId: hId,
      appointmentDate,
      shiftId: sId,
      tokenNumber: -(pendingCount + 1),
      status: 'PENDING',
      paymentStatus: 'PENDING',
    },
    include: { doctor: { include: { user: true } }, hospital: true, shift: true },
  });

  res.status(201).json({
    success: true,
    message: 'Appointment booked! Please complete payment to get your token number.',
    appointment,
    consultationFee: doctor.consultationFee || 500,
  });
}));

// ── MY APPOINTMENTS ──
// Feature 1: Flag unviewed past appointments that can be rescheduled
// Feature 3: Flag appointments where doctor went on leave
router.get('/appointments/my', authenticate, asyncHandler(async (req: any, res: any) => {
  const appointments = await prisma.appointment.findMany({
    where: { patientId: req.user.id },
    include: { doctor: { include: { user: true } }, hospital: true, shift: true },
    orderBy: { createdAt: 'desc' },
  });

  const today = new Date().toISOString().split('T')[0];

  // Check for leaves that affect patient's active appointments
  const activeAppts = appointments.filter((a: any) =>
    ['BOOKED', 'PENDING'].includes(a.status!)
  );
  const leaveAffected: number[] = [];
  for (const a of activeAppts) {
    if (a.appointmentDate) {
      const onLeave = await isDoctorOnLeave(a.doctorId, a.appointmentDate, a.shiftId);
      if (onLeave) leaveAffected.push(a.id);
    }
  }

  const enriched = appointments.map((a: any) => {
    const isPast = a.appointmentDate && a.appointmentDate < today;
    const wasNotViewed = ['BOOKED', 'PENDING'].includes(a.status!);
    const canRescheduleUnviewed = isPast && wasNotViewed;
    const doctorOnLeave = leaveAffected.includes(a.id);
    const canReschedule = (['BOOKED', 'PENDING'].includes(a.status!) && a.status !== 'CANCELLED') || canRescheduleUnviewed;

    return {
      ...a,
      canRescheduleUnviewed,
      doctorOnLeave,
      canReschedule,
    };
  });

  res.json({ appointments: enriched });
}));

router.get('/appointments/:id/status', authenticate, asyncHandler(async (req: any, res: any) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { patient: true, doctor: { include: { user: true } }, hospital: true, shift: true },
  });
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json({ appointment });
}));

// ── RESCHEDULE APPOINTMENT ──
// Supports: normal reschedule, unviewed past reschedule, doctor-leave reschedule
router.post('/appointments/:id/reschedule', authenticate, asyncHandler(async (req: any, res: any) => {
  const patientId = req.user.id;
  const appointmentId = parseInt(req.params.id);
  const { newDate, newShiftId } = req.body;

  if (!newDate) return res.status(400).json({ error: 'newDate is required (YYYY-MM-DD)' });

  const todayStr = new Date().toISOString().split('T')[0];
  if (newDate < todayStr) return res.status(400).json({ error: 'Cannot reschedule to a past date' });

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shift: true, doctor: { include: { user: true, hospital: true } }, hospital: true },
  });

  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  if (appointment.patientId !== patientId) return res.status(403).json({ error: 'Not your appointment' });

  // Allow reschedule for BOOKED/PENDING (including unviewed past ones)
  const isUnviewed = ['BOOKED', 'PENDING'].includes(appointment.status!);
  if (!isUnviewed) {
    return res.status(400).json({ error: `Cannot reschedule "${appointment.status}" appointment. Only BOOKED or PENDING can be rescheduled.` });
  }

  // Check booking horizon for new date
  const maxDays = (appointment.doctor as any).hospital?.maxBookingDaysAhead ?? 7;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(newDate + 'T00:00:00');
  const diffDays = Math.floor((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > maxDays) {
    return res.status(400).json({ error: `Booking is only allowed up to ${maxDays} day(s) ahead` });
  }

  const targetShiftId = newShiftId ? parseInt(newShiftId) : appointment.shiftId;

  if (newDate === appointment.appointmentDate && targetShiftId === appointment.shiftId) {
    return res.status(400).json({ error: 'New date and shift are the same as current appointment' });
  }

  // Check doctor leave on new date
  const onLeave = await isDoctorOnLeave(appointment.doctorId, newDate, targetShiftId);
  if (onLeave) return res.status(400).json({ error: 'Doctor is on leave on the selected date' });

  // Check working day
  if (targetShiftId) {
    const shift = await prisma.doctorShift.findUnique({ where: { id: targetShiftId } });
    if (shift && !isWorkingDay(shift, newDate)) {
      const dayName = new Date(newDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long' });
      return res.status(400).json({ error: `Doctor does not work on ${dayName}s` });
    }
  }

  // Check existing booking on new date
  const existingOnNewDate = await prisma.appointment.findFirst({
    where: {
      patientId, doctorId: appointment.doctorId, appointmentDate: newDate,
      status: { not: 'CANCELLED' }, id: { not: appointmentId },
    },
  });
  if (existingOnNewDate) return res.status(400).json({ error: 'You already have an appointment with this doctor on the selected date' });

  // Check shift capacity
  if (targetShiftId) {
    const shift = await prisma.doctorShift.findUnique({ where: { id: targetShiftId } });
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    const bookedCount = await prisma.appointment.count({
      where: {
        doctorId: appointment.doctorId, appointmentDate: newDate, shiftId: targetShiftId,
        status: { not: 'CANCELLED' }, id: { not: appointmentId },
      },
    });
    if (bookedCount >= shift.tokenLimit) return res.status(400).json({ error: 'No slots available for this shift on the selected date' });
  }

  // If PAID → reassign token
  if (appointment.paymentStatus === 'PAID') {
    const result = await prisma.$transaction(async (tx: any) => {
      const whereMax: any = {
        doctorId: appointment.doctorId, appointmentDate: newDate,
        paymentStatus: 'PAID', id: { not: appointmentId },
      };
      if (targetShiftId) whereMax.shiftId = targetShiftId;
      const maxToken = await tx.appointment.aggregate({
        where: whereMax,
        _max: { tokenNumber: true },
      });
      const newToken = (maxToken._max.tokenNumber || 0) + 1;
      return tx.appointment.update({
        where: { id: appointmentId },
        data: { appointmentDate: newDate, shiftId: targetShiftId, tokenNumber: newToken, status: 'BOOKED' },
        include: { doctor: { include: { user: true } }, hospital: true, shift: true },
      });
    });
    return res.json({
      success: true,
      message: `Rescheduled to ${newDate}. New token: #${result.tokenNumber}`,
      appointment: result,
    });
  }

  // If PENDING → just update date
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { appointmentDate: newDate, shiftId: targetShiftId },
    include: { doctor: { include: { user: true } }, hospital: true, shift: true },
  });
  res.json({ success: true, message: `Rescheduled to ${newDate}`, appointment: updated });
}));

// ── RESCHEDULE OPTIONS ──
// Respects: working days, doctor leave, booking horizon
// Optimized: batch all DB queries instead of per-date-per-shift
router.get('/appointments/:id/reschedule-options', authenticate, asyncHandler(async (req: any, res: any) => {
  const appointmentId = parseInt(req.params.id);
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      shift: true,
      doctor: { include: { hospital: true, shifts: { where: { isActive: true } } } },
    },
  });

  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  if (appointment.patientId !== req.user.id) return res.status(403).json({ error: 'Not your appointment' });

  const today = new Date();
  const maxDays = (appointment.doctor as any).hospital?.maxBookingDaysAhead ?? 7;
  const shifts = (appointment.doctor as any).shifts || [];

  // Build all date strings
  const allDates: string[] = [];
  for (let i = 0; i <= maxDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    allDates.push(d.toISOString().split('T')[0]);
  }

  // Batch 1: Fetch ALL leaves for this doctor across the date range in ONE query
  const allLeaves = await prisma.doctorLeave.findMany({
    where: { doctorId: appointment.doctorId, leaveDate: { in: allDates } },
  });

  // Batch 2: Fetch ALL appointment counts grouped by date+shift in ONE query
  const allCounts = await prisma.appointment.groupBy({
    by: ['appointmentDate', 'shiftId'],
    where: {
      doctorId: appointment.doctorId,
      appointmentDate: { in: allDates },
      status: { not: 'CANCELLED' },
      id: { not: appointmentId },
    },
    _count: { id: true },
  });

  // Build lookup maps
  const countMap = new Map<string, number>();
  for (const c of allCounts) {
    countMap.set(`${c.appointmentDate}_${c.shiftId}`, c._count.id);
  }

  // Check shift end times for today
  const nowTime = new Date();
  const currentHHMM = `${String(nowTime.getHours()).padStart(2,'0')}:${String(nowTime.getMinutes()).padStart(2,'0')}`;
  const todayStr = today.toISOString().split('T')[0];

  const dates: { date: string; shifts: any[]; onLeave: boolean }[] = [];

  for (const dateStr of allDates) {
    const leavesForDate = allLeaves.filter((l: any) => l.leaveDate === dateStr);
    const dayOnLeave = leavesForDate.some((l: any) => l.shiftId === null);

    const shiftsForDate = shifts.map((shift: any) => {
      const shiftOnLeave = dayOnLeave || leavesForDate.some((l: any) => l.shiftId === shift.id);
      const isWorking = isWorkingDay(shift, dateStr);
      const booked = countMap.get(`${dateStr}_${shift.id}`) || 0;
      const shiftEnded = dateStr === todayStr && currentHHMM >= shift.endTime;

      return {
        ...shift,
        appointmentCount: booked,
        availableSlots: (shiftOnLeave || !isWorking || shiftEnded) ? 0 : Math.max(0, shift.tokenLimit - booked),
        isAvailable: !shiftOnLeave && isWorking && !shiftEnded && booked < shift.tokenLimit,
        onLeave: shiftOnLeave,
        notWorkingDay: !isWorking,
        shiftEnded,
      };
    });

    dates.push({ date: dateStr, shifts: shiftsForDate, onLeave: dayOnLeave });
  }

  res.json({ dates, maxBookingDaysAhead: maxDays });
}));

export default router;

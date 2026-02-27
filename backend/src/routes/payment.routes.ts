import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Fake payment — assigns token number and moves appointment to BOOKED
router.post('/demo-pay/:appointmentId', authenticate, asyncHandler(async (req: any, res: any) => {
  const appointmentId = parseInt(req.params.appointmentId);

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shift: true, doctor: true },
  });
  if (!existing) return res.status(404).json({ error: 'Appointment not found' });
  if (existing.paymentStatus === 'PAID') return res.status(400).json({ error: 'Already paid' });
  if (existing.status === 'CANCELLED') return res.status(400).json({ error: 'Appointment is cancelled' });

  // Use doctor's actual consultation fee (fallback to 500 if not set)
  const consultationFee = (existing as any).doctor?.consultationFee || 500;

  // Transaction: safely assign next token number and mark as paid
  const appointment = await prisma.$transaction(async (tx: any) => {
    // Count existing PAID appointments for this doctor+date+shift to get next token
    const whereCount: any = {
      doctorId: existing.doctorId,
      appointmentDate: existing.appointmentDate,
      paymentStatus: 'PAID',
    };
    if (existing.shiftId) whereCount.shiftId = existing.shiftId;

    const paidCount = await tx.appointment.count({ where: whereCount });
    const nextToken = paidCount + 1;

    // Check token limit if shift exists
    if (existing.shift && nextToken > existing.shift.tokenLimit) {
      throw new Error('Token limit reached for this shift. Cannot process payment.');
    }

    // Create fake payment record
    await tx.payment.create({
      data: {
        appointmentId,
        amount: consultationFee,
        provider: 'DEMO',
        providerPaymentId: `DEMO_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'SUCCESS',
      },
    });

    // Update appointment: assign token, mark as BOOKED and PAID
    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        tokenNumber: nextToken,
        status: 'BOOKED',
        paymentStatus: 'PAID',
      },
      include: {
        doctor: { include: { user: true } },
        hospital: true,
        shift: true,
        patient: true,
      },
    });
  });

  res.json({
    success: true,
    message: `Payment successful! Your token number is #${appointment.tokenNumber}`,
    appointment,
    invoice: {
      invoiceId: `INV-${appointment.id}-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      patientName: (appointment as any).patient?.name || 'Patient',
      patientPhone: (appointment as any).patient?.phone || '',
      doctorName: (appointment as any).doctor?.user?.name || 'Doctor',
      specialization: (appointment as any).doctor?.specialization || '',
      hospitalName: (appointment as any).hospital?.name || 'Hospital',
      hospitalAddress: (appointment as any).hospital?.address || '',
      shiftName: (appointment as any).shift?.shiftName || 'General',
      shiftTime: (appointment as any).shift ? `${(appointment as any).shift.startTime} - ${(appointment as any).shift.endTime}` : '',
      appointmentDate: appointment.appointmentDate,
      tokenNumber: appointment.tokenNumber,
      amount: consultationFee,
      paymentMethod: 'Demo Payment',
      status: 'PAID',
    },
  });
}));

router.get('/status/:appointmentId', authenticate, asyncHandler(async (req: any, res: any) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(req.params.appointmentId) },
    include: { payment: true },
  });
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json({ appointment });
}));

// ── GET INVOICE (reconstruct from appointment data) ──
router.get('/invoice/:appointmentId', authenticate, asyncHandler(async (req: any, res: any) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(req.params.appointmentId) },
    include: {
      doctor: { include: { user: true } },
      hospital: true,
      shift: true,
      patient: true,
      payment: true,
    },
  });
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  if (appointment.patientId !== req.user.id) return res.status(403).json({ error: 'Not your appointment' });
  if (appointment.paymentStatus !== 'PAID') return res.status(400).json({ error: 'Appointment is not paid yet' });

  const payment = (appointment as any).payment;
  const invoice = {
    invoiceId: `INV-${appointment.id}-${(payment?.createdAt ? new Date(payment.createdAt).getTime() : Date.now()).toString(36).toUpperCase()}`,
    date: payment?.createdAt || appointment.createdAt,
    patientName: (appointment as any).patient?.name || 'Patient',
    patientPhone: (appointment as any).patient?.phone || '',
    doctorName: (appointment as any).doctor?.user?.name || 'Doctor',
    specialization: (appointment as any).doctor?.specialization || '',
    hospitalName: (appointment as any).hospital?.name || 'Hospital',
    hospitalAddress: (appointment as any).hospital?.address || '',
    shiftName: (appointment as any).shift?.shiftName || 'General',
    shiftTime: (appointment as any).shift ? `${(appointment as any).shift.startTime} - ${(appointment as any).shift.endTime}` : '',
    appointmentDate: appointment.appointmentDate,
    tokenNumber: appointment.tokenNumber,
    amount: payment?.amount || (appointment as any).doctor?.consultationFee || 500,
    paymentMethod: payment?.provider === 'DEMO' ? 'Demo Payment' : (payment?.provider || 'Online Payment'),
    status: 'PAID',
  };

  res.json({ success: true, invoice });
}));

export default router;

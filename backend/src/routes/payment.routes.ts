import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createOrder, verifyPayment } from '../services/payment.service.js';

const router = Router();

// Create Razorpay order
router.post(
  '/create-order',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { appointmentId } = req.body;
    const patientId = req.user.id;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { doctor: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (appointment.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Already paid' });
    }

    const fee = appointment.doctor?.consultationFee ?? 0;

    try {
      const order = await createOrder({
        amount: fee,
        receipt: `apt_${appointmentId}`,
      });

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          appointmentId,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create payment order' });
    }
  })
);

// Verify payment (client-side verification)
router.post(
  '/verify',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !appointmentId) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { doctor: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Create/update payment record
    await prisma.payment.upsert({
      where: { appointmentId: appointment.id },
      update: {
        status: 'PAID',
        providerPaymentId: razorpay_payment_id,
      },
      create: {
        appointmentId: appointment.id,
        amount: appointment.doctor?.consultationFee ?? 0,
        provider: 'razorpay',
        providerPaymentId: razorpay_payment_id,
        status: 'PAID',
      },
    });

    // Update appointment payment status AND booking status
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { paymentStatus: 'PAID', status: 'BOOKED' },
    });

    res.json({ success: true, message: 'Payment verified successfully' });
  })
);

// Demo Pay — FOR TESTING ONLY — instantly marks payment as done
router.post(
  '/demo-pay',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { appointmentId } = req.body;
    const patientId = req.user.id;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { doctor: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (appointment.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Already paid' });
    }

    // Create payment record
    await prisma.payment.upsert({
      where: { appointmentId: appointment.id },
      update: {
        status: 'PAID',
        providerPaymentId: `demo_${Date.now()}`,
      },
      create: {
        appointmentId: appointment.id,
        amount: appointment.doctor?.consultationFee ?? 0,
        provider: 'demo',
        providerPaymentId: `demo_${Date.now()}`,
        status: 'PAID',
      },
    });

    // Update appointment → PAID + BOOKED
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { paymentStatus: 'PAID', status: 'BOOKED' },
      include: { doctor: { include: { user: true } }, hospital: true },
    });

    res.json({
      success: true,
      message: `Payment successful! Token #${updated.tokenNumber} is confirmed.`,
      appointment: updated,
    });
  })
);

// Webhook (server-side, no auth)
router.post(
  '/webhook',
  asyncHandler(async (req: any, res: any) => {
    const secret = process.env.WEBHOOK_SECRET || '';
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    if (signature && secret) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const { payload } = req.body;
    if (payload?.payment?.entity) {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      const notes = payment.notes || {};
      const appointmentId = notes.appointmentId;

      if (appointmentId) {
        const appointment = await prisma.appointment.findUnique({
          where: { id: parseInt(appointmentId) },
          include: { doctor: true },
        });

        if (appointment) {
          await prisma.payment.upsert({
            where: { appointmentId: appointment.id },
            update: {
              status: 'PAID',
              providerPaymentId: payment.id,
            },
            create: {
              appointmentId: appointment.id,
              amount: appointment.doctor?.consultationFee ?? 0,
              provider: 'razorpay',
              providerPaymentId: payment.id,
              status: 'PAID',
            },
          });

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { paymentStatus: 'PAID', status: 'BOOKED' },
          });
        }
      }
    }

    res.json({ status: 'ok' });
  })
);

// Get payment details
router.get(
  '/appointment/:appointmentId',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const payment = await prisma.payment.findUnique({
      where: { appointmentId: parseInt(req.params.appointmentId) },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  })
);

export default router;

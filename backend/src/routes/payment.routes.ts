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
  asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const patientId = (req as any).user.id;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID required' });
    }

    // Get appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
      },
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

    try {
      // Create Razorpay order
      const order = await createOrder({
        amount: appointment.doctor.consultationFee,
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
      res.status(500).json({ error: 'Failed to create order' });
    }
  })
);

// Verify payment webhook
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const { order_id, payment_id, signature } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Verify Razorpay signature
    const isValid = verifyPayment(order_id, payment_id, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Find appointment by order_id (receipt format: apt_appointmentId)
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: order_id.replace('apt_', ''),
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update payment
    await prisma.payment.upsert({
      where: { appointmentId: appointment.id },
      update: {
        status: 'PAID',
        providerPaymentId: payment_id,
      },
      create: {
        appointmentId: appointment.id,
        amount: appointment.doctor.consultationFee,
        provider: 'razorpay',
        providerPaymentId: payment_id,
        status: 'PAID',
      },
    });

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        paymentStatus: 'PAID',
        status: 'BOOKED', // Ensure status is BOOKED after payment
      },
    });

    res.json({ success: true, message: 'Payment verified' });
  })
);

// Get payment details
router.get(
  '/appointment/:appointmentId',
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({
      where: { appointmentId: req.params.appointmentId },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  })
);

export default router;

import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateSendOtp, validateVerifyOtp } from '../middleware/validation.js';
import { generateOtp, sendOtpViaSms } from '../services/sms.service.js';
import { generateToken } from '../services/jwt.service.js';
import { setRedis, getRedis, deleteRedis } from '../services/redis.service.js';

const router = Router();

// Send OTP
router.post(
  '/send-otp',
  validateSendOtp,
  asyncHandler(async (req, res) => {
    const { phone } = req.body;

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in Redis
    await setRedis(`otp:${phone}`, { code: otp, expiresAt }, 300);

    // In production, uncomment to send real SMS
    // await sendOtpViaSms(phone, otp);

    // For testing, return OTP (REMOVE IN PRODUCTION)
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && { otp }), // Dev only
    });
  })
);

// Verify OTP and Login/Register
router.post(
  '/verify-otp',
  validateVerifyOtp,
  asyncHandler(async (req, res) => {
    const { phone, otp, name } = req.body;

    // Get OTP from Redis
    const storedOtp = await getRedis(`otp:${phone}`);

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (storedOtp.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Delete OTP
    await deleteRedis(`otp:${phone}`);

    // Check if user exists (graceful fallback for no database)
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { phone },
      });

      // If not exists, create new patient
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            name: name || null,
            role: 'PATIENT',
          },
        });
      }
    } catch (error) {
      // Database unavailable - create demo user
      console.log('⚠️ Database unavailable, using demo user');
      user = {
        id: `demo-${phone}`,
        phone,
        name: name || 'Demo User',
        role: 'PATIENT',
        hospitalId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    // Generate JWT
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
      hospitalId: user.hospitalId || undefined,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  })
);

// Get current user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: (req as any).user.id },
      });

      if (!user) {
        // Return user from token if database unavailable
        return res.json({
          user: {
            id: (req as any).user.id,
            phone: (req as any).user.phone,
            role: (req as any).user.role,
            hospitalId: (req as any).user.hospitalId,
          },
        });
      }

      res.json({
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          hospitalId: user.hospitalId,
        },
      });
    } catch (error) {
      // Database unavailable - return user from token
      console.log('⚠️ Database unavailable, returning user from token');
      res.json({
        user: {
          id: (req as any).user.id,
          phone: (req as any).user.phone,
          role: (req as any).user.role,
          hospitalId: (req as any).user.hospitalId,
        },
      });
    }
  })
);

export default router;

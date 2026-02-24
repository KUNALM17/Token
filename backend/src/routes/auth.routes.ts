import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateSendOtp, validateVerifyOtp } from '../middleware/validation.js';
import { generateOtp, sendOtpViaSms } from '../services/sms.service.js';
import { generateToken } from '../services/jwt.service.js';
import { setRedis, getRedis, deleteRedis } from '../services/redis.service.js';

const router = Router();

// Send OTP — also tells frontend if user is new or existing
router.post(
  '/send-otp',
  validateSendOtp,
  asyncHandler(async (req: any, res: any) => {
    const { phone } = req.body;

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP
    await setRedis(`otp:${phone}`, { code: otp, expiresAt }, 300);

    console.log(`OTP for ${phone}: ${otp}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      isNewUser: !existingUser,
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  })
);

// Verify OTP and Login/Register
router.post(
  '/verify-otp',
  validateVerifyOtp,
  asyncHandler(async (req: any, res: any) => {
    const { phone, otp, name, age, gender, weight, city } = req.body;

    const storedOtp = await getRedis(`otp:${phone}`);

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP expired or not sent' });
    }

    if (storedOtp.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    await deleteRedis(`otp:${phone}`);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // New user → create as PATIENT with profile
      if (!name) {
        return res.status(400).json({ error: 'Name is required for new users' });
      }
      user = await prisma.user.create({
        data: {
          phone,
          name,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          weight: weight ? parseInt(weight) : null,
          city: city || null,
          role: 'PATIENT',
        } as any,
      });
    }

    const u = user as any;
    const token = generateToken({
      id: u.id,
      phone: u.phone,
      role: u.role,
      hospitalId: u.hospitalId ?? undefined,
    });

    res.json({
      success: true,
      token,
      user: {
        id: u.id,
        phone: u.phone,
        name: u.name,
        role: u.role,
        hospitalId: u.hospitalId,
        age: u.age,
        gender: u.gender,
        weight: u.weight,
        city: u.city,
      },
    });
  })
);

// Get current user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = user as any;
    res.json({
      user: {
        id: u.id,
        phone: u.phone,
        name: u.name,
        role: u.role,
        hospitalId: u.hospitalId,
        age: u.age,
        gender: u.gender,
        weight: u.weight,
        city: u.city,
      },
    });
  })
);

export default router;

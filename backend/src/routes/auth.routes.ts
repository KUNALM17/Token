import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { generateToken } from '../services/jwt.service';
import { setRedis, getRedis, deleteRedis } from '../services/redis.service';
import { generateOtp, sendOtpViaSms } from '../services/sms.service';

const router = Router();

// Send OTP
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) return res.status(400).json({ error: 'Valid 10-digit phone required' });

  const otp = generateOtp();
  await setRedis(`otp:${phone}`, { code: otp, expiresAt: new Date(Date.now() + 5*60*1000) }, 300);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !existingUser;

  // Send OTP via Fast2SMS
  let smsSent = false;
  try {
    const smsResult = await sendOtpViaSms(phone, otp);
    smsSent = smsResult.success;
    if (smsSent) {
      console.log(`✓ OTP sent to ${phone} via SMS`);
    } else {
      console.log(`⚠ SMS failed for ${phone}, OTP: ${otp}`);
    }
  } catch (err: any) {
    console.error(`SMS error for ${phone}:`, err?.message);
    console.log(`⚠ Fallback — OTP for ${phone}: ${otp}`);
  }

  res.json({
    success: true,
    message: smsSent ? 'OTP sent to your phone' : 'OTP generated (check console in dev)',
    isNewUser,
    ...((!smsSent && process.env.NODE_ENV === 'development') && { otp }),
  });
}));

// Verify OTP
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { phone, otp, name, age, gender, weight, city } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const storedOtp = await getRedis(`otp:${phone}`);
  if (!storedOtp) return res.status(400).json({ error: 'OTP expired' });
  if (storedOtp.code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  await deleteRedis(`otp:${phone}`);

  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    if (!name) return res.status(400).json({ error: 'Name required for new users' });
    const createData: any = { phone, name, role: 'PATIENT' };
    if (age) createData.age = parseInt(age);
    if (gender) createData.gender = gender;
    if (weight) createData.weight = parseInt(weight);
    if (city) createData.city = city;
    user = await prisma.user.create({ data: createData });
  }

  const u = user as any;
  const token = generateToken({ id: user.id, phone: user.phone, role: user.role, hospitalId: u.hospitalId || undefined });

  res.json({
    success: true, token,
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role, hospitalId: u.hospitalId, age: u.age, gender: u.gender, weight: u.weight, city: u.city },
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: (req as any).user.id } });
  if (!user) return res.json({ user: (req as any).user });
  const u = user as any;
  res.json({ user: { id: user.id, phone: user.phone, name: user.name, role: user.role, hospitalId: u.hospitalId, age: u.age, gender: u.gender, weight: u.weight, city: u.city } });
}));

export default router;

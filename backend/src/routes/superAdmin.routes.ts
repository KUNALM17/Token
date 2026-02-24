import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateCreateHospital } from '../middleware/validation.js';

const router = Router();

// Create hospital
router.post(
  '/hospitals',
  authenticate,
  authorize('SUPER_ADMIN'),
  validateCreateHospital,
  asyncHandler(async (req: any, res: any) => {
    const { name, address, city, state, phone } = req.body;

    const hospital = await prisma.hospital.create({
      data: { name, address, city, state, phone },
    });

    res.status(201).json({ success: true, hospital });
  })
);

// Get all hospitals
router.get(
  '/hospitals',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { doctors: true, appointments: true } },
      },
    });

    res.json({ hospitals });
  })
);

// Get hospital by ID
router.get(
  '/hospitals/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const hospital = await prisma.hospital.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        doctors: { include: { user: true } },
      },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const admins = await prisma.user.findMany({
      where: { hospitalId: hospital.id, role: 'HOSPITAL_ADMIN' },
    });

    res.json({ hospital, admins });
  })
);

// Update hospital status
router.put(
  '/hospitals/:id/status',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const { isActive } = req.body;

    const hospital = await prisma.hospital.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive },
    });

    res.json({ success: true, hospital });
  })
);

// Create hospital admin
router.post(
  '/hospital-admins',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const { phone, name, hospitalId } = req.body;

    if (!phone || !hospitalId) {
      return res.status(400).json({ error: 'Phone and hospitalId are required' });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: parseInt(hospitalId) },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { phone },
        data: {
          role: 'HOSPITAL_ADMIN',
          hospitalId: parseInt(hospitalId),
          name: name || existingUser.name,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || null,
          role: 'HOSPITAL_ADMIN',
          hospitalId: parseInt(hospitalId),
        },
      });
    }

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
      },
    });
  })
);

// Get all hospital admins
router.get(
  '/hospital-admins',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: any, res: any) => {
    const admins = await prisma.user.findMany({
      where: { role: 'HOSPITAL_ADMIN' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ admins });
  })
);

export default router;

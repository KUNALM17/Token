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
  asyncHandler(async (req, res) => {
    const { name, address, city, state, phone } = req.body;

    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
        city,
        state,
        phone,
      },
    });

    res.status(201).json({ success: true, hospital });
  })
);

// Get all hospitals
router.get(
  '/hospitals',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ hospitals });
  })
);

// Get hospital by ID
router.get(
  '/hospitals/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.params.id },
      include: {
        doctors: true,
        users: true,
      },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({ hospital });
  })
);

// Update hospital status
router.put(
  '/hospitals/:id/status',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    const hospital = await prisma.hospital.update({
      where: { id: req.params.id },
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
  asyncHandler(async (req, res) => {
    const { phone, name, hospitalId } = req.body;

    if (!phone || !hospitalId) {
      return res.status(400).json({ error: 'Phone and hospitalId required' });
    }

    // Check if hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    let user;
    if (existingUser) {
      // Update existing user
      user = await prisma.user.update({
        where: { phone },
        data: {
          role: 'HOSPITAL_ADMIN',
          hospitalId,
          name: name || existingUser.name,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          phone,
          name: name || null,
          role: 'HOSPITAL_ADMIN',
          hospitalId,
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

export default router;

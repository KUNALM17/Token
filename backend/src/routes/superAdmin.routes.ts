import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/hospitals', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { name, address, city, state, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Hospital name required' });
  const hospital = await prisma.hospital.create({ data: { name, address, city, state, phone } });
  res.status(201).json({ success: true, hospital });
}));

router.get('/hospitals', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const hospitals = await prisma.hospital.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ hospitals });
}));

router.delete('/hospitals/:id', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  await prisma.hospital.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
}));

router.put('/hospitals/:id/status', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { isActive } = req.body;
  const hospital = await prisma.hospital.update({ where: { id: parseInt(req.params.id) }, data: { isActive } });
  res.json({ success: true, hospital });
}));

router.post('/hospital-admins', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { phone, name, hospitalId } = req.body;
  if (!phone || !hospitalId) return res.status(400).json({ error: 'Phone and hospitalId required' });

  const hId = parseInt(hospitalId);
  const hospital = await prisma.hospital.findUnique({ where: { id: hId } });
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  let user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    user = await prisma.user.update({ where: { phone }, data: { role: 'HOSPITAL_ADMIN', hospitalId: hId, name: name || user.name } });
  } else {
    user = await prisma.user.create({ data: { phone, name: name || null, role: 'HOSPITAL_ADMIN', hospitalId: hId } });
  }

  res.status(201).json({ success: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, hospitalId: user.hospitalId } });
}));

// ── USER MANAGEMENT (Super Admin) ──
// List all users with optional filters
router.get('/users', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const search = req.query.search as string || '';
  const role = req.query.role as string || '';
  const hospitalId = req.query.hospitalId ? parseInt(req.query.hospitalId) : undefined;

  const where: any = {};
  if (role && role !== 'ALL') where.role = role;
  if (hospitalId) where.hospitalId = hospitalId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, phone: true, name: true, role: true, age: true, gender: true, weight: true, city: true, hospitalId: true, isActive: true, createdAt: true },
    take: 100,
  });

  const stats = {
    total: await prisma.user.count(),
    patients: await prisma.user.count({ where: { role: 'PATIENT' } }),
    doctors: await prisma.user.count({ where: { role: 'DOCTOR' } }),
    admins: await prisma.user.count({ where: { role: 'HOSPITAL_ADMIN' } }),
  };

  res.json({ users, stats });
}));

// Create a user
router.post('/users', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { phone, name, role, hospitalId, age, gender, weight, city } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) return res.status(400).json({ error: 'Phone must be 10 digits' });

  const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  if (existing) return res.status(400).json({ error: 'User with this phone already exists' });

  const user = await prisma.user.create({
    data: {
      phone: cleanPhone,
      name: name || null,
      role: role || 'PATIENT',
      hospitalId: hospitalId ? parseInt(hospitalId) : null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      weight: weight ? parseInt(weight) : null,
      city: city || null,
    },
  });
  res.status(201).json({ success: true, user });
}));

// Update a user
router.patch('/users/:id', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const { name, role, hospitalId, age, gender, weight, city, phone } = req.body;
  const id = parseInt(req.params.id);
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (hospitalId !== undefined) data.hospitalId = hospitalId ? parseInt(hospitalId) : null;
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
  res.json({ success: true, user: updated });
}));

// Delete a user
router.delete('/users/:id', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'SUPER_ADMIN') return res.status(403).json({ error: 'Cannot delete super admin' });

  // Cascade: delete appointments → payments, doctor profiles, OTPs
  const apptIds = (await prisma.appointment.findMany({ where: { patientId: id }, select: { id: true } })).map((a: any) => a.id);
  if (apptIds.length > 0) {
    await prisma.payment.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.appointment.deleteMany({ where: { patientId: id } });
  }
  // If doctor, also delete doctor appointments
  const doctor = await prisma.doctor.findUnique({ where: { userId: id } });
  if (doctor) {
    const docApptIds = (await prisma.appointment.findMany({ where: { doctorId: doctor.id }, select: { id: true } })).map((a: any) => a.id);
    if (docApptIds.length > 0) {
      await prisma.payment.deleteMany({ where: { appointmentId: { in: docApptIds } } });
      await prisma.appointment.deleteMany({ where: { doctorId: doctor.id } });
    }
    await prisma.doctorShift.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctor.delete({ where: { id: doctor.id } });
  }
  await prisma.oTP.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
}));

export default router;

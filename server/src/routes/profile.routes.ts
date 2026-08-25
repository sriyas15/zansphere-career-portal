import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { updateProfileSchema, changePasswordSchema } from '../utils/validators';

const router = Router();
router.use(authMiddleware);

// ── GET /api/profile ─────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.portalUser.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ── PUT /api/profile ─────────────────────────────────────────
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const user = await prisma.portalUser.update({
      where: { id: req.userId },
      data: parsed.data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
      },
    });

    // Sync to active applications
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    await prisma.portalApplication.updateMany({
      where: { userId: user.id },
      data: { fullName, phone: user.phone },
    });

    // Sync to Zanpeople Candidates table using raw SQL
    await prisma.$queryRawUnsafe(`
      UPDATE candidates 
      SET name = $1, phone = $2, updated_at = NOW()
      WHERE email = $3
    `, fullName, user.phone, user.email);

    res.json({ message: 'Profile updated successfully!', user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ── POST /api/profile/change-password ────────────────────────
router.post('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => e.message);
      res.status(400).json({ error: errors[0], errors });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.portalUser.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.portalUser.update({
      where: { id: req.userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;

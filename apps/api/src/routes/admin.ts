import { Router } from 'express';
import { prisma } from '@cig/db';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { param } from '../middleware/params.js';

export const adminRouter = Router();

adminRouter.get('/users/pending', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ ok: true, data: users });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/users/:id/approve', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = param(req, 'id');

    const user = await prisma.user.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
});

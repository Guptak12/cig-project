import { Router } from 'express';
import { prisma } from '@cig/db';

export const clubsRouter = Router();

// GET /clubs — list available clubs for event creation
clubsRouter.get('/', async (_req, res, next) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true },
    });

    res.json({ ok: true, data: clubs });
  } catch (err) {
    next(err);
  }
});

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

// POST /clubs — admin creates a club
clubsRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, logoUrl } = req.body;
    const club = await prisma.club.create({
      data: { name: name ?? 'Photography Society', logoUrl: logoUrl ?? null },
    });
    res.status(201).json({ ok: true, data: club });
  } catch (err) {
    next(err);
  }
});

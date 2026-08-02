import { Router } from 'express';
import { prisma } from '@cig/db';
import { CreateEventSchema, CreateAlbumSchema } from '@cig/types';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { param } from '../middleware/params.js';

export const eventsRouter = Router();

// GET /events — list all public events, sorted by name
eventsRouter.get('/', async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { isPublic: true },
      orderBy: { name: 'asc' },
      include: {
        club: { select: { id: true, name: true, logoUrl: true } },
        albums: { select: { id: true, name: true }, where: { isPublic: true } },
      },
    });
    res.json({ ok: true, data: events });
  } catch (err) {
    next(err);
  }
});

// POST /events — admin or club account
eventsRouter.post('/', requireAuth, requireRole('ADMIN', 'CLUB'), async (req, res, next) => {
  try {
    const body = CreateEventSchema.parse(req.body);
    const event = await prisma.event.create({
      data: {
        name: body.name,
        description: body.description,
        date: new Date(body.date),
        clubId: body.clubId,
        isPublic: body.isPublic,
      },
    });
    res.status(201).json({ ok: true, data: event });
  } catch (err) {
    next(err);
  }
});

// GET /events/:id
eventsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = param(req, 'id');

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        club: true,
        albums: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            isPublic: true,
            qrToken: true,
            media: { select: { s3Key: true }, take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({ ok: false, error: 'Event not found' });
      return;
    }

    const { generatePresignedViewUrl } = await import('@cig/utils');
    const albumsWithCovers = await Promise.all(
      event.albums.map(async (album) => {
        const firstMedia = album.media?.[0];
        let coverUrl: string | null = null;
        if (firstMedia) {
          coverUrl = await generatePresignedViewUrl(firstMedia.s3Key);
        }
        return {
          id: album.id,
          name: album.name,
          isPublic: album.isPublic,
          qrToken: album.qrToken,
          coverUrl,
        };
      })
    );

    res.json({ ok: true, data: { ...event, albums: albumsWithCovers } });
  } catch (err) {
    next(err);
  }
});

// PATCH /events/:id — admin or club account
eventsRouter.patch('/:id', requireAuth, requireRole('ADMIN', 'CLUB'), async (req, res, next) => {
  try {
    const id = param(req, 'id');
    const body = CreateEventSchema.partial().parse(req.body);

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });
    res.json({ ok: true, data: event });
  } catch (err) {
    next(err);
  }
});

// DELETE /events/:id — admin or club account
eventsRouter.delete('/:id', requireAuth, requireRole('ADMIN', 'CLUB'), async (req, res, next) => {
  try {
    const id = param(req, 'id');
    await prisma.event.delete({ where: { id } });
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
});

// POST /events/:id/albums — admin, club account, or photographer
eventsRouter.post(
  '/:id/albums',
  requireAuth,
  requireRole('ADMIN', 'CLUB', 'PHOTOGRAPHER'),
  async (req, res, next) => {
    try {
      const eventId = param(req, 'id');
      const body = CreateAlbumSchema.parse(req.body);

      const album = await prisma.album.create({
        data: { name: body.name, isPublic: body.isPublic, eventId },
      });
      res.status(201).json({ ok: true, data: album });
    } catch (err) {
      next(err);
    }
  },
);

import { Router } from 'express';
import { prisma } from '@cig/db';
import { AddReactionSchema, AddCommentSchema } from '@cig/types';
import { requireAuth } from '../middleware/auth.js';
import { fetchS3Object, applyWatermark } from '@cig/utils';

export const mediaRouter = Router();

// GET /media/view — public image view/stream endpoint with fallback
mediaRouter.get('/view', async (req, res) => {
  try {
    const key = (req.query.key as string) || '';
    if (!key) {
      res.status(400).send('Missing key parameter');
      return;
    }

    const imageBuffer = await fetchS3Object(key);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#181824"/>
          <stop offset="100%" stop-color="#0a0a0f"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="400" cy="270" r="80" fill="none" stroke="#f4f0e5" stroke-width="3" opacity="0.3"/>
      <path d="M360 270 L440 270 M400 230 L400 310" stroke="#f4f0e5" stroke-width="3" opacity="0.3"/>
      <text x="400" y="400" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="22" font-weight="700" fill="#f4f0e5" text-anchor="middle" opacity="0.8">✨ AURA EVENT GALLERY</text>
    </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  }
});

// GET /media/:id/download — watermarked download
mediaRouter.get('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const mediaId = req.params.id as string;

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        album: {
          include: {
            event: { include: { club: { select: { name: true } } } },
          },
        },
      },
    });

    if (!media) {
      res.status(404).json({ ok: false, error: 'Media not found' });
      return;
    }

    // Fetch original from S3
    const imageBuffer = await fetchS3Object(media.s3Key);

    // Apply watermark with club, event, and role context
    const watermarked = await applyWatermark(imageBuffer, {
      clubName: media.album.event.club.name,
      eventName: media.album.event.name,
      userRole: req.auth!.role,
    });

    // Return as downloadable JPEG
    const filename = `${media.album.event.name.replace(/\s+/g, '-')}-${media.id}.jpg`;
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(watermarked);
  } catch (err) {
    next(err);
  }
});

// POST /media/:id/reactions — toggle reaction (upsert/delete)
mediaRouter.post('/:id/reactions', requireAuth, async (req, res, next) => {
  try {
    const { type } = AddReactionSchema.parse(req.body);
    const mediaId = req.params.id as string;
    const userId = req.auth!.userId;

    // Check if user already reacted with this type → toggle off
    const existing = await prisma.reaction.findUnique({
      where: { mediaId_userId: { mediaId, userId } },
    });

    if (existing && existing.type === type) {
      // Same type → remove (toggle off)
      await prisma.reaction.delete({ where: { mediaId_userId: { mediaId, userId } } });
      const counts = await prisma.reaction.groupBy({
        by: ['type'],
        where: { mediaId },
        _count: { type: true },
      });
      res.json({ ok: true, data: { counts, userReaction: null } });
      return;
    }

    // Upsert (different type or new)
    const reaction = await prisma.reaction.upsert({
      where: { mediaId_userId: { mediaId, userId } },
      update: { type },
      create: { mediaId, userId, type },
    });

    const counts = await prisma.reaction.groupBy({
      by: ['type'],
      where: { mediaId },
      _count: { type: true },
    });

    res.json({ ok: true, data: { reaction, counts, userReaction: reaction.type } });
  } catch (err) {
    next(err);
  }
});

// GET /media/:id/reactions — get reaction counts
mediaRouter.get('/:id/reactions', requireAuth, async (req, res, next) => {
  try {
    const mediaId = req.params.id as string;
    const userId = req.auth!.userId;

    const reactions = await prisma.reaction.groupBy({
      by: ['type'],
      where: { mediaId },
      _count: { type: true },
    });

    const userReaction = await prisma.reaction.findUnique({
      where: { mediaId_userId: { mediaId, userId } },
    });

    res.json({ ok: true, data: { counts: reactions, userReaction: userReaction?.type ?? null } });
  } catch (err) {
    next(err);
  }
});

// POST /media/:id/comments
mediaRouter.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { body: commentBody } = AddCommentSchema.parse(req.body);
    const mediaId = req.params.id as string;

    const comment = await prisma.comment.create({
      data: {
        body: commentBody,
        mediaId,
        userId: req.auth!.userId,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    res.status(201).json({ ok: true, data: comment });
  } catch (err) {
    next(err);
  }
});

// GET /media/:id/comments
mediaRouter.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const mediaId = req.params.id as string;

    const comments = await prisma.comment.findMany({
      where: { mediaId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ ok: true, data: comments });
  } catch (err) {
    next(err);
  }
});

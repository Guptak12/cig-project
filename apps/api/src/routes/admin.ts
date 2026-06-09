import { Router } from 'express';
import { prisma } from '@cig/db';
import { mediaProcessQueue } from '@cig/utils';
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

adminRouter.get('/media-processing/status', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const [totalMedia, missingThumbs, missingTags, missingFaceIds, queueCounts] = await Promise.all([
      prisma.media.count(),
      prisma.media.count({ where: { thumbKey: null } }),
      prisma.media.count({ where: { tags: { equals: [] } } }),
      prisma.media.count({ where: { faceIds: { equals: [] } } }),
      mediaProcessQueue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed', 'paused'),
    ]);

    res.json({
      ok: true,
      data: {
        totalMedia,
        missingThumbs,
        missingTags,
        missingFaceIds,
        queue: queueCounts,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/media-processing/requeue', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const media = await prisma.media.findMany({
      where: {
        OR: [
          { thumbKey: null },
          { tags: { equals: [] } },
          { faceIds: { equals: [] } },
        ],
      },
      select: { id: true, s3Key: true, albumId: true },
      orderBy: { createdAt: 'asc' },
      take: 250,
    });

    await Promise.all(
      media.map((item) =>
        mediaProcessQueue.add(
          'process',
          { mediaId: item.id, s3Key: item.s3Key, albumId: item.albumId },
          { jobId: `reprocess:${item.id}` },
        ),
      ),
    );

    res.json({ ok: true, data: { requeued: media.length } });
  } catch (err) {
    next(err);
  }
});

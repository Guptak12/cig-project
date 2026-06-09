import { Router } from 'express';
import { prisma } from '@cig/db';
import { PresignRequestSchema, ConfirmUploadSchema } from '@cig/types';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generatePresignedUploadUrl, generatePresignedViewUrl } from '@cig/utils';
import { mediaProcessQueue } from '@cig/utils';
import { param } from '../middleware/params.js';
import { v4 as uuidv4 } from 'uuid';

export const albumsRouter = Router();

// GET /albums/share/:token — public album access via QR token (must be before /:id routes)
albumsRouter.get('/share/:token', async (req, res, next) => {
  try {
    const token = param(req, 'token');

    const album = await prisma.album.findUnique({
      where: { qrToken: token },
      include: {
        event: { include: { club: { select: { name: true } } } },
        media: {
          take: 24,
          orderBy: { createdAt: 'desc' },
          select: { id: true, s3Key: true, thumbKey: true, tags: true },
        },
      },
    });

    if (!album) {
      res.status(404).json({ ok: false, error: 'Invalid share link' });
      return;
    }

    res.json({ ok: true, data: album });
  } catch (err) {
    next(err);
  }
});

// GET /albums/:id/media — cursor-based pagination for infinite scroll
albumsRouter.get('/:id/media', requireAuth, async (req, res, next) => {
  try {
    const albumId = param(req, 'id');
    const cursor = req.query.cursor as string | undefined;
    const limit = 24;

    // Check album access
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: { members: { where: { userId: req.auth!.userId } } },
    });

    if (!album) {
      res.status(404).json({ ok: false, error: 'Album not found' });
      return;
    }

    const isPrivate = !album.isPublic;
    const isMember = album.members.length > 0;
    const isAdminOrPhotographer = ['ADMIN', 'CLUB', 'PHOTOGRAPHER'].includes(req.auth!.role);

    if (isPrivate && !isMember && !isAdminOrPhotographer) {
      res.status(403).json({ ok: false, error: 'Access denied to private album' });
      return;
    }

    const items = await prisma.media.findMany({
      where: { albumId },
      take: limit + 1, // fetch one extra to determine if there's a next page
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reactions: true, comments: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    const cdnBase = process.env.CDN_URL ?? '';

    // Resolve view URL server-side:
    //  - thumbKey exists → CloudFront (fast, public, no expiry)
    //  - thumbKey null   → presigned S3 URL for originals (15-min expiry)
    const itemsWithUrls = await Promise.all(
      page.map(async (item) => {
        let viewUrl: string;
        if (item.thumbKey && cdnBase) {
          const normalizedBase = cdnBase.replace(/\/$/, '');
          const normalizedKey = item.thumbKey.startsWith('/')
            ? item.thumbKey.slice(1)
            : item.thumbKey;
          viewUrl = `${normalizedBase}/${normalizedKey}`;
        } else {
          // Fallback: generate a presigned URL for the original
          viewUrl = await generatePresignedViewUrl(item.s3Key);
        }
        return { ...item, viewUrl };
      }),
    );

    res.json({ ok: true, data: { items: itemsWithUrls, nextCursor } });
  } catch (err) {
    next(err);
  }
});

// POST /albums/:id/media/presign — get S3 presigned upload URL
albumsRouter.post(
  '/:id/media/presign',
  requireAuth,
  requireRole('ADMIN', 'CLUB', 'PHOTOGRAPHER', 'MEMBER'),
  async (req, res, next) => {
    try {
      const albumId = param(req, 'id');
      const body = PresignRequestSchema.parse({ ...req.body, albumId });
      const result = await generatePresignedUploadUrl({
        albumId: body.albumId,
        fileName: body.fileName,
        contentType: body.contentType,
      });
      res.json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

// POST /albums/:id/media/confirm — save record + enqueue processing job
albumsRouter.post(
  '/:id/media/confirm',
  requireAuth,
  requireRole('ADMIN', 'CLUB', 'PHOTOGRAPHER', 'MEMBER'),
  async (req, res, next) => {
    try {
      const albumId = param(req, 'id');
      const body = ConfirmUploadSchema.parse({ ...req.body, albumId });

      const media = await prisma.media.create({
        data: {
          s3Key: body.s3Key,
          mimeType: 'image/jpeg',
          albumId: body.albumId,
          uploadedById: req.auth!.userId,
          tags: [],
          faceIds: [],
        },
      });

      // Enqueue background job: thumbnail + AI tagging + face search
      await mediaProcessQueue.add('process', {
        mediaId: media.id,
        s3Key: body.s3Key,
        albumId: body.albumId,
      });

      res.status(201).json({ ok: true, data: media });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /albums/:id — admin or club account
albumsRouter.delete('/:id', requireAuth, requireRole('ADMIN', 'CLUB'), async (req, res, next) => {
  try {
    const id = param(req, 'id');
    await prisma.album.delete({ where: { id } });
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
});

// GET /albums/:id/qr — get or generate QR share token
albumsRouter.get('/:id/qr', requireAuth, async (req, res, next) => {
  try {
    const id = param(req, 'id');
    let album = await prisma.album.findUnique({ where: { id } });

    if (!album) {
      res.status(404).json({ ok: false, error: 'Album not found' });
      return;
    }

    // Lazily generate QR token on first request
    if (!album.qrToken) {
      album = await prisma.album.update({
        where: { id },
        data: { qrToken: uuidv4() },
      });
    }

    const shareUrl = `${process.env.WEB_URL}/share/${album.qrToken}`;
    res.json({ ok: true, data: { qrToken: album.qrToken, shareUrl } });
  } catch (err) {
    next(err);
  }
});

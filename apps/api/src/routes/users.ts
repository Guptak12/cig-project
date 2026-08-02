import { Router } from 'express';
import multer from 'multer';
import { prisma } from '@cig/db';
import { requireAuth } from '../middleware/auth.js';
import { generatePresignedUploadUrl, indexUserFace } from '@cig/utils';

export const usersRouter = Router();

// Memory storage — selfie is small (<2MB), we process in-memory then hand to Rekognition
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /users/selfie — upload reference selfie for facial recognition
usersRouter.post('/selfie', requireAuth, upload.single('selfie'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: 'No file uploaded' });
      return;
    }

    const userId = req.auth!.userId;

    const s3Key = `selfies/${userId}/selfie.jpg`;
    const { uploadToOriginalsBucket } = await import('@cig/utils');

    await uploadToOriginalsBucket({
      key: s3Key,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    // Index in Rekognition → get faceId
    const faceId = await indexUserFace(s3Key, userId);

    if (!faceId) {
      res.status(422).json({ ok: false, error: 'Could not detect a face in the selfie. Please try again with a clear photo.' });
      return;
    }

    // Persist both keys on the user record
    await prisma.user.update({
      where: { id: userId },
      data: { selfieKey: s3Key, faceId },
    });

    res.json({ ok: true, data: { message: 'Selfie indexed successfully', faceId } });
  } catch (err) {
    next(err);
  }
});

// GET /users/me/photos — all photos containing the authenticated user's face
usersRouter.get('/me/photos', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { faceId: true },
    });

    if (!user?.faceId) {
      res.json({ ok: true, data: [] });
      return;
    }

    // PostgreSQL array contains operator via Prisma raw query
    const photos = await prisma.$queryRaw<
      Array<{ id: string; s3Key: string; thumbKey: string | null; albumId: string; createdAt: Date }>
    >`
      SELECT id, "s3Key", "thumbKey", "albumId", "createdAt"
      FROM "Media"
      WHERE ${user.faceId} = ANY("faceIds")
      ORDER BY "createdAt" DESC
      LIMIT 100
    `;
    const { generatePresignedViewUrl } = await import('@cig/utils');
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        viewUrl: await generatePresignedViewUrl(photo.s3Key),
        tags: [],
        _count: { reactions: 0, comments: 0 },
      }))
    );

    res.json({ ok: true, data: photosWithUrls });
  } catch (err) {
    next(err);
  }
});

// GET /users/me — profile
usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { id: true, name: true, email: true, role: true, selfieKey: true, faceId: true, createdAt: true },
    });
    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
});

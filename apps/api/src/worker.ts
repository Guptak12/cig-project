/**
 * Background worker process — runs separately from the API server.
 * Processes: thumbnail generation, AI label tagging, facial recognition search.
 *
 * Start with: npx tsx src/worker.ts
 * In Docker: separate container using the same image with different CMD.
 */
import 'dotenv/config';
import { prisma } from '@cig/db';
import {
  Worker,
  QUEUE_MEDIA_PROCESS,
  redisOpts,
  type MediaProcessJobData,
  fetchS3Object,
  generateThumbnail,
  uploadToThumbsBucket,
  detectImageLabels,
  searchFacesInPhoto,
} from '@cig/utils';

const worker = new Worker<MediaProcessJobData>(
  QUEUE_MEDIA_PROCESS,
  async (job) => {
    const { mediaId, s3Key } = job.data;
    console.log(`[worker] Processing media ${mediaId}`);

    // 1. Generate thumbnail
    const imageBuffer = await fetchS3Object(s3Key);
    const thumbBuffer = await generateThumbnail(imageBuffer);

    const thumbKey = s3Key.replace('albums/', 'thumbs/');
    await uploadToThumbsBucket({ key: thumbKey, buffer: thumbBuffer, contentType: 'image/jpeg' });

    // 2. Detect AI labels
    const tags = await detectImageLabels(s3Key);

    // 3. Search faces
    const faceIds = await searchFacesInPhoto(s3Key);

    // 4. Persist results
    await prisma.media.update({
      where: { id: mediaId },
      data: { thumbKey, tags, faceIds },
    });

    console.log(`[worker] Done: ${mediaId} | tags: ${tags.length} | faces: ${faceIds.length}`);
  },
  {
    ...redisOpts,
    concurrency: 3, // process up to 3 images in parallel
  },
);

worker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

console.log('[worker] Media processing worker started');

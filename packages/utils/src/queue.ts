import { Queue, Worker, type Job } from 'bullmq';

// BullMQ bundles its own ioredis — pass URL string, not an external Redis instance.
// This avoids type conflicts between the two ioredis versions.
const rawRedisUrl = (process.env.REDIS_URL ?? 'redis://localhost:6379')
  .trim()
  .replace(/^["']|["']$/g, '');

const redisOpts = {
  connection: {
    url: rawRedisUrl,
    maxRetriesPerRequest: null as null, // required by BullMQ
  },
};

// ─── Queue names ──────────────────────────────────────────────────────────────

export const QUEUE_MEDIA_PROCESS = 'media-process';

// ─── Job data shapes ──────────────────────────────────────────────────────────

export interface MediaProcessJobData {
  mediaId: string;
  s3Key: string;
  albumId: string;
}

// ─── Queue instance ───────────────────────────────────────────────────────────

export const mediaProcessQueue = new Queue<MediaProcessJobData>(QUEUE_MEDIA_PROCESS, {
  ...redisOpts,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Export shared redis opts for workers
export { redisOpts };

// Re-export Worker so the API worker process can create typed workers
export { Worker, type Job };

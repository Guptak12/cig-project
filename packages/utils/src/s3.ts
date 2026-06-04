import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_ORIGINALS = process.env.S3_BUCKET_ORIGINALS!;
export const BUCKET_THUMBS = process.env.S3_BUCKET_THUMBS!;

/**
 * Generate a presigned PUT URL so the client uploads directly to S3.
 * The original never touches our API server bandwidth.
 */
export async function generatePresignedUploadUrl(opts: {
  albumId: string;
  fileName: string;
  contentType: string;
}): Promise<{ uploadUrl: string; s3Key: string }> {
  const ext = opts.fileName.split('.').pop() ?? 'jpg';
  const s3Key = `albums/${opts.albumId}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_ORIGINALS,
    Key: s3Key,
    ContentType: opts.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
  return { uploadUrl, s3Key };
}

/**
 * Generate a short-lived signed GET URL for private media.
 * Expires in 15 minutes to prevent link sharing.
 */
export async function generatePresignedViewUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_ORIGINALS,
    Key: s3Key,
  });
  return getSignedUrl(s3, command, { expiresIn: 900 }); // 15 min
}

/**
 * Fetch raw image buffer from the originals bucket.
 * Used by the watermark-on-download flow.
 */
export async function fetchS3Object(s3Key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET_ORIGINALS, Key: s3Key });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error(`Empty S3 response for key: ${s3Key}`);
  }

  // Convert readable stream to Buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Upload a processed buffer (e.g. thumbnail) to the public thumbs bucket.
 */
export async function uploadToThumbsBucket(opts: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_THUMBS,
    Key: opts.key,
    Body: opts.buffer,
    ContentType: opts.contentType,
  });
  await s3.send(command);
}

export { s3 };

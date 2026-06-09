import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectLabelsCommand,
  DetectFacesCommand,
} from '@aws-sdk/client-rekognition';
import sharp from 'sharp';
import { fetchS3Object, BUCKET_ORIGINALS } from './s3.js';

const isMock = process.env.AWS_ACCESS_KEY_ID === 'mock-access-key-id';

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'mock',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'mock',
  },
});

const FACE_COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID ?? 'cig-faces';

/**
 * Index a user's selfie into the Rekognition face collection.
 * Returns the assigned FaceId to store on the User record.
 */
export async function indexUserFace(selfieS3Key: string, userId: string): Promise<string | null> {
  if (isMock) {
    return `mock-face-id-${userId}`;
  }

  const command = new IndexFacesCommand({
    CollectionId: FACE_COLLECTION_ID,
    Image: {
      S3Object: { Bucket: BUCKET_ORIGINALS, Name: selfieS3Key },
    },
    ExternalImageId: userId, // tie back to user for auditing
    DetectionAttributes: [],
    MaxFaces: 1, // only index the primary face in the selfie
  });

  const result = await rekognition.send(command);
  const faceRecord = result.FaceRecords?.[0];
  return faceRecord?.Face?.FaceId ?? null;
}

/**
 * Search a photo for all faces and return matching Rekognition FaceIds.
 * Called for each confirmed media upload in the background job.
 */
export async function searchFacesInPhoto(photoS3Key: string): Promise<string[]> {
  if (isMock) {
    const { prisma } = await import('@cig/db');
    const users = await prisma.user.findMany({ where: { faceId: { not: null } } });
    return users.map((u: { faceId: string | null }) => u.faceId!).filter(Boolean);
  }

  const imageBuffer = await fetchS3Object(photoS3Key);

  // 1. Detect all faces
  const detectCommand = new DetectFacesCommand({
    Image: { Bytes: imageBuffer },
  });

  let detectResult;
  try {
    detectResult = await rekognition.send(detectCommand);
  } catch (err) {
    console.error('[rekognition] Error detecting faces:', err);
    return [];
  }

  const faces = detectResult.FaceDetails ?? [];
  const matchedFaceIds = new Set<string>();

  if (faces.length === 0) {
    return [];
  }

  // 2. Crop each face and search against the collection
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1;
  const height = metadata.height ?? 1;

  for (const face of faces) {
    if (!face.BoundingBox) continue;

    const box = face.BoundingBox;
    // Add a slight margin (e.g. 10%) around the bounding box to ensure the whole face is captured
    const marginW = (box.Width ?? 0) * 0.1;
    const marginH = (box.Height ?? 0) * 0.1;
    
    const rawLeft = Math.max(0, (box.Left ?? 0) - marginW);
    const rawTop = Math.max(0, (box.Top ?? 0) - marginH);
    const rawWidth = Math.min(1 - rawLeft, (box.Width ?? 1) + marginW * 2);
    const rawHeight = Math.min(1 - rawTop, (box.Height ?? 1) + marginH * 2);

    const left = Math.floor(rawLeft * width);
    const top = Math.floor(rawTop * height);
    const cropWidth = Math.floor(rawWidth * width);
    const cropHeight = Math.floor(rawHeight * height);

    if (cropWidth <= 0 || cropHeight <= 0) continue;

    try {
      const faceBuffer = await image
        .clone()
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .toBuffer();

      const searchCommand = new SearchFacesByImageCommand({
        CollectionId: FACE_COLLECTION_ID,
        Image: { Bytes: faceBuffer },
        MaxFaces: 1, // We only need to know if this specific face matches someone in our collection
        FaceMatchThreshold: 90,
      });

      const searchResult = await rekognition.send(searchCommand);
      for (const match of searchResult.FaceMatches ?? []) {
        if (match.Face?.FaceId) {
          matchedFaceIds.add(match.Face.FaceId);
        }
      }
    } catch (err: any) {
      if (err.name !== 'InvalidParameterException') {
        console.error('[rekognition] Error searching cropped face:', err);
      }
    }
  }

  return Array.from(matchedFaceIds);
}

/**
 * Detect content labels for a photo (e.g. "Party", "Outdoor", "People").
 * Returns a flat list of label names.
 */
export async function detectImageLabels(photoS3Key: string): Promise<string[]> {
  if (isMock) {
    return ['Event', 'People', 'Gathering', 'Club', 'Smile'];
  }

  const command = new DetectLabelsCommand({
    Image: {
      S3Object: { Bucket: BUCKET_ORIGINALS, Name: photoS3Key },
    },
    MaxLabels: 15,
    MinConfidence: 70,
  });

  const result = await rekognition.send(command);
  return (result.Labels ?? [])
    .map((l) => l.Name)
    .filter((name): name is string => Boolean(name));
}

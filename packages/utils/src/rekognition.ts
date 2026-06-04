import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectLabelsCommand,
} from '@aws-sdk/client-rekognition';
import { fetchS3Object, BUCKET_ORIGINALS } from './s3.js';

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FACE_COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID ?? 'cig-faces';

/**
 * Index a user's selfie into the Rekognition face collection.
 * Returns the assigned FaceId to store on the User record.
 */
export async function indexUserFace(selfieS3Key: string, userId: string): Promise<string | null> {
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
  const imageBuffer = await fetchS3Object(photoS3Key);

  const command = new SearchFacesByImageCommand({
    CollectionId: FACE_COLLECTION_ID,
    Image: { Bytes: imageBuffer },
    MaxFaces: 20,
    // Only accept strong matches (>= 90% similarity)
    FaceMatchThreshold: 90,
  });

  try {
    const result = await rekognition.send(command);
    return (result.FaceMatches ?? [])
      .map((m) => m.Face?.FaceId)
      .filter((id): id is string => Boolean(id));
  } catch (err) {
    // InvalidParameterException is thrown when no face is detected in image
    // This is expected for landscape/object photos — not an error
    if ((err as { name?: string }).name === 'InvalidParameterException') {
      return [];
    }
    throw err;
  }
}

/**
 * Detect content labels for a photo (e.g. "Party", "Outdoor", "People").
 * Returns a flat list of label names.
 */
export async function detectImageLabels(photoS3Key: string): Promise<string[]> {
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

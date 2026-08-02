import { prisma } from './index.js';

export async function initDbTables() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLUB', 'PHOTOGRAPHER', 'MEMBER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'MEMBER',
        "isApproved" BOOLEAN NOT NULL DEFAULT true,
        "approvedAt" TIMESTAMP(3),
        "selfieKey" TEXT,
        "faceId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Club" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "logoUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP(3) NOT NULL,
        "isPublic" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "clubId" TEXT NOT NULL REFERENCES "Club"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Album" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "isPublic" BOOLEAN NOT NULL DEFAULT true,
        "qrToken" TEXT UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Media" (
        "id" TEXT PRIMARY KEY,
        "s3Key" TEXT NOT NULL,
        "thumbKey" TEXT,
        "mimeType" TEXT NOT NULL,
        "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "faceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "caption" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "albumId" TEXT NOT NULL REFERENCES "Album"("id") ON DELETE CASCADE,
        "uploadedById" TEXT NOT NULL REFERENCES "User"("id")
      );

      CREATE TABLE IF NOT EXISTS "AlbumMember" (
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "albumId" TEXT NOT NULL REFERENCES "Album"("id") ON DELETE CASCADE,
        PRIMARY KEY ("userId", "albumId")
      );

      CREATE TABLE IF NOT EXISTS "Reaction" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "mediaId" TEXT NOT NULL REFERENCES "Media"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "Reaction_mediaId_userId_key" UNIQUE ("mediaId", "userId")
      );

      CREATE TABLE IF NOT EXISTS "Comment" (
        "id" TEXT PRIMARY KEY,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "mediaId" TEXT NOT NULL REFERENCES "Media"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);
    console.log('[db] Auto-initialized database schema DDL tables successfully.');
  } catch (err: any) {
    console.error('[db] Error initializing DDL tables:', err.message);
  }
}

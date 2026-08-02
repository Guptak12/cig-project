// Re-export Prisma client as a singleton to prevent connection pool exhaustion
// during hot-reload in development (Next.js / ts-node-dev).

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

// Load .env (if not already loaded by the consuming app)
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://cig:cig_secret@localhost:5432/cig_db";
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { initDbTables } from './init-db.js';

// Re-export everything from @prisma/client so consumers only need @cig/db
export * from '@prisma/client';

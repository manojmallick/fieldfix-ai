import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? '';

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Set it to your Neon Postgres URL or a SQLite file URL for local dev (file:./dev.db)'
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. For Vercel + SQLite, use file:/tmp/fieldfix.db');
}

if (
  process.env.NODE_ENV === 'production' &&
  databaseUrl.startsWith('file:') &&
  !databaseUrl.startsWith('file:/tmp/')
) {
  console.warn(
    'SQLite database path is not under /tmp. Vercel functions require a writable path like file:/tmp/fieldfix.db'
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

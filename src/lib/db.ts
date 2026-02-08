import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const databaseUrl = process.env.DATABASE_URL ?? '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. For Vercel + SQLite, use file:/tmp/fieldfix.db');
}

if (process.env.VERCEL) {
  try {
    fs.mkdirSync('/tmp', { recursive: true });
  } catch {
    // Best effort; /tmp exists on Vercel but avoid crashing on edge cases.
  }
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

let sqliteSchemaReady = false;

const sqliteMigrationDirs = [
  '20260208000000_init',
  '20260208100000_kb_snapshot',
];

async function runSqliteMigrations() {
  const migrationsRoot = path.join(process.cwd(), 'prisma', 'migrations');

  for (const dir of sqliteMigrationDirs) {
    const sqlPath = path.join(migrationsRoot, dir, 'migration.sql');

    if (!fs.existsSync(sqlPath)) {
      continue;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql
      .replace(/--.*$/gm, '')
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  }
}

export async function ensureSqliteSchema() {
  if (sqliteSchemaReady) return;

  if (!databaseUrl.startsWith('file:/tmp/')) {
    sqliteSchemaReady = true;
    return;
  }

  const existing = await prisma.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Session'"
  );

  if (existing.length === 0) {
    await runSqliteMigrations();
  }

  sqliteSchemaReady = true;
}

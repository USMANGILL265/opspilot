import { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../logger';

const log = createChildLogger('Database');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on?.('query', (e: { query: string; duration: number }) => {
    if (e.duration > 150) {
      log.warn({ query: e.query, durationMs: e.duration }, 'Slow database query detected');
    }
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    log.error({ error: err }, 'Database healthcheck query failed');
    return false;
  }
}

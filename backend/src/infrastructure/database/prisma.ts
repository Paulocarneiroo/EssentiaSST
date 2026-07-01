import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env.js';

/**
 * Cliente Prisma único (singleton) compartilhado por toda a aplicação.
 * Substitui o antigo pool `pg`.
 */
export const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

/** Verifica a conectividade com o banco (usado no health check). */
export const ping = async (): Promise<boolean> => {
  const rows = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
  return rows[0]?.ok === 1;
};

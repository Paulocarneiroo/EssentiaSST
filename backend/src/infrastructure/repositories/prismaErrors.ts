/** Prisma lança P2025 quando o registro alvo de update/delete não existe. */
export const isRecordNotFound = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';

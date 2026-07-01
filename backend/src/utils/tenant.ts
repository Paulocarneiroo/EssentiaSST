import type { Request } from 'express';
import { UnauthorizedError } from '../domain/errors/AppError.js';

/**
 * Retorna o `empresaId` (tenant) do usuário autenticado.
 * Deve ser usado apenas em rotas protegidas por `authenticate`.
 */
export const getTenantId = (req: Request): string => {
  const empresaId = req.usuario?.empresaId;
  if (!empresaId) {
    throw new UnauthorizedError('Não autenticado.');
  }
  return empresaId;
};

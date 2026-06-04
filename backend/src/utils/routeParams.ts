import type { Request } from 'express';
import { ValidationError } from '../domain/errors/AppError.js';

export const getRouteParam = (req: Request, name: string): string => {
  const value = req.params[name];
  if (!value) {
    throw new ValidationError(`Parâmetro de rota "${name}" é obrigatório.`);
  }
  return value;
};

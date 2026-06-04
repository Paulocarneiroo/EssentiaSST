import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../domain/errors/AppError.js';

interface HttpError extends Error {
  status?: number;
  code?: string;
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Rota ${req.method} ${req.originalUrl} não encontrada.`,
  });
};

export const errorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const status = err instanceof AppError ? err.status : (err.status ?? 500);
  const code = err instanceof AppError ? err.code : (err.name || 'InternalServerError');
  const payload: Record<string, unknown> = {
    error: code,
    message: err.message || 'Erro interno do servidor.',
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
};

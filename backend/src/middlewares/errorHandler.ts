import type { ErrorRequestHandler, RequestHandler } from 'express';

interface HttpError extends Error {
  status?: number;
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Rota ${req.method} ${req.originalUrl} não encontrada.`,
  });
};

export const errorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const status = err.status ?? 500;
  const payload: Record<string, unknown> = {
    error: err.name || 'InternalServerError',
    message: err.message || 'Erro interno do servidor.',
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
};

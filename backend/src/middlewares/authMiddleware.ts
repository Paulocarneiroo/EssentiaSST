import type { RequestHandler } from 'express';
import type { Papel } from '../domain/entities/Usuario.js';
import { ForbiddenError, UnauthorizedError } from '../domain/errors/AppError.js';
import { tokenService } from '../infrastructure/di/container.js';

/** Exige um Bearer token válido e anexa o payload em `req.usuario`. */
export const authenticate: RequestHandler = (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticação ausente.');
    }
    const token = header.slice('Bearer '.length).trim();
    req.usuario = tokenService.verify(token);
    next();
  } catch (error) {
    next(error);
  }
};

/** Restringe o acesso a determinados papéis. Use após `authenticate`. */
export const authorize =
  (...papeis: Papel[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.usuario) {
      next(new UnauthorizedError('Não autenticado.'));
      return;
    }
    if (!papeis.includes(req.usuario.papel)) {
      next(new ForbiddenError('Você não tem permissão para acessar este recurso.'));
      return;
    }
    next();
  };

import type { AuthTokenPayload } from '../domain/entities/Usuario.js';

// Anexa o usuário autenticado à Request após o middleware `authenticate`.
declare global {
  namespace Express {
    interface Request {
      usuario?: AuthTokenPayload;
    }
  }
}

export {};

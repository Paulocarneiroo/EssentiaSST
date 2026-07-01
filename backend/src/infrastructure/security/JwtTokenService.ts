import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { AuthTokenPayload, Papel } from '../../domain/entities/Usuario.js';
import { UnauthorizedError } from '../../domain/errors/AppError.js';
import type { ITokenService } from '../../application/ports/ITokenService.js';
import { env } from '../../config/env.js';

export class JwtTokenService implements ITokenService {
  sign(payload: AuthTokenPayload): string {
    const options: SignOptions = { expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.jwt.secret, options);
  }

  verify(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwt.secret);
      if (typeof decoded === 'string' || !isAuthPayload(decoded)) {
        throw new UnauthorizedError('Token inválido.');
      }
      return { sub: decoded.sub, empresaId: decoded.empresaId, papel: decoded.papel };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Token inválido ou expirado.');
    }
  }
}

const isAuthPayload = (value: jwt.JwtPayload): value is jwt.JwtPayload & AuthTokenPayload =>
  typeof value.sub === 'string' &&
  typeof value.empresaId === 'string' &&
  (value.papel === 'ADMIN' || (value.papel as Papel) === 'OPERADOR');

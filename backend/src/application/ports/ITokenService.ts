import type { AuthTokenPayload } from '../../domain/entities/Usuario.js';

/**
 * Abstração para emissão/verificação de tokens de autenticação (DIP).
 * A implementação concreta (ex.: JWT via jsonwebtoken) pode ser trocada sem alterar o AuthService.
 */
export interface ITokenService {
  sign(payload: AuthTokenPayload): string;
  verify(token: string): AuthTokenPayload;
}

/**
 * Abstração para hashing de senhas (DIP).
 * A implementação concreta (ex.: bcrypt) pode ser trocada sem alterar o AuthService.
 */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

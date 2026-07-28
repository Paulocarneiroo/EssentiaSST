export type Papel = 'ADMIN' | 'OPERADOR';

export const PAPEIS: readonly Papel[] = ['ADMIN', 'OPERADOR'];

/** Usuário como o backend devolve: sem hash de senha (H2.1). */
export interface Usuario {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  papel: Papel;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  senha: string;
}

export interface RegisterData {
  empresaId: string;
  nome: string;
  email: string;
  senha: string;
  papel?: Papel;
}

export interface AuthResult {
  token: string;
  usuario: Usuario;
}

export type Papel = 'ADMIN' | 'OPERADOR';

export interface Usuario {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
  createdAt: Date;
  updatedAt: Date;
}

/** Usuário sem o hash de senha — formato seguro para retornar em respostas. */
export type PublicUsuario = Omit<Usuario, 'senhaHash'>;

export interface RegisterData {
  empresaId: string;
  nome: string;
  email: string;
  senha: string;
  papel?: Papel;
}

/** Dados já validados e prontos para persistência (senha em texto puro, ainda não hasheada). */
export interface CreateUsuarioData {
  empresaId: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
}

export interface LoginData {
  email: string;
  senha: string;
}

/** Conteúdo assinado no JWT. */
export interface AuthTokenPayload {
  sub: string; // id do usuário
  empresaId: string;
  papel: Papel;
}

export interface AuthResult {
  token: string;
  usuario: PublicUsuario;
}

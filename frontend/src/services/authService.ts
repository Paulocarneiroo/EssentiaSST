import { authApi } from '../api/authApi.js';
import { empresaApi } from '../api/empresaApi.js';
import { clearSessao, setSessao, setUsuario } from '../state/session.js';
import type { CreateEmpresaData } from '../types/empresa.js';
import type { AuthResult, LoginData, Papel, Usuario } from '../types/usuario.js';
import { onlyDigits } from './format.js';

export interface NovaContaData {
  empresa: CreateEmpresaData;
  admin: { nome: string; email: string; senha: string };
}

export const authService = {
  /** H2.2 — autentica e guarda o token da sessão. */
  async login(input: LoginData): Promise<AuthResult> {
    const resultado = await authApi.login({
      email: input.email.trim().toLowerCase(),
      senha: input.senha,
    });
    setSessao(resultado);
    return resultado;
  },

  /**
   * Primeiro acesso: cadastra a empresa (H1.1) e, em seguida, seu primeiro ADMIN
   * pela rota pública de bootstrap (H2.1). A sessão já sai autenticada.
   */
  async criarConta(input: NovaContaData): Promise<AuthResult> {
    const empresa = await empresaApi.create({
      ...input.empresa,
      cnpj: onlyDigits(input.empresa.cnpj),
      razaoSocial: input.empresa.razaoSocial.trim(),
      nomeFantasia: input.empresa.nomeFantasia.trim(),
      cnae: input.empresa.cnae.trim(),
      grauRisco: Number(input.empresa.grauRisco),
    });

    const resultado = await authApi.bootstrap({
      empresaId: empresa.id,
      nome: input.admin.nome.trim(),
      email: input.admin.email.trim().toLowerCase(),
      senha: input.admin.senha,
      papel: 'ADMIN',
    });

    setSessao(resultado);
    return resultado;
  },

  /**
   * H2.1 — ADMIN registra um usuário do próprio tenant.
   * O `empresaId` enviado é ignorado pelo backend, que usa sempre o tenant de quem registra.
   */
  async registrarUsuario(input: {
    empresaId: string;
    nome: string;
    email: string;
    senha: string;
    papel: Papel;
  }): Promise<Usuario> {
    const { usuario } = await authApi.register({
      empresaId: input.empresaId,
      nome: input.nome.trim(),
      email: input.email.trim().toLowerCase(),
      senha: input.senha,
      papel: input.papel,
    });
    return usuario;
  },

  /** Revalida o token contra a API e atualiza os dados do usuário em cache. */
  async revalidar(): Promise<Usuario> {
    const usuario = await authApi.me();
    setUsuario(usuario);
    return usuario;
  },

  logout(): void {
    clearSessao();
  },
};

import type {
  AuthResult,
  LoginData,
  Papel,
  PublicUsuario,
  RegisterData,
  Usuario,
} from '../../domain/entities/Usuario.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../domain/errors/AppError.js';
import { validateLogin, validateRegister } from '../../domain/validators/authValidator.js';
import type { IEmpresaRepository } from '../ports/IEmpresaRepository.js';
import type { IPasswordHasher } from '../ports/IPasswordHasher.js';
import type { ITokenService } from '../ports/ITokenService.js';
import type { IUsuarioRepository } from '../ports/IUsuarioRepository.js';

const toPublic = (usuario: Usuario): PublicUsuario => ({
  id: usuario.id,
  empresaId: usuario.empresaId,
  nome: usuario.nome,
  email: usuario.email,
  papel: usuario.papel,
  createdAt: usuario.createdAt,
  updatedAt: usuario.updatedAt,
});

export class AuthService {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly empresaRepository: IEmpresaRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * Registro feito por um ADMIN autenticado: o usuário nasce sempre no tenant
   * de quem registra, independentemente do `empresaId` enviado no corpo.
   */
  async register(raw: RegisterData, tenantId: string): Promise<AuthResult> {
    const data = validateRegister({ ...raw, empresaId: tenantId });
    return this.createUsuario(data);
  }

  /**
   * Bootstrap público: cria o primeiro ADMIN de uma empresa recém-cadastrada.
   * Só é permitido enquanto a empresa não tem nenhum usuário — a partir daí,
   * novos usuários passam obrigatoriamente por `register` (ADMIN autenticado).
   */
  async bootstrap(raw: RegisterData): Promise<AuthResult> {
    const data = validateRegister({ ...raw, papel: 'ADMIN' });

    const usuariosExistentes = await this.usuarioRepository.countByEmpresa(data.empresaId);
    if (usuariosExistentes > 0) {
      throw new ConflictError(
        'Esta empresa já possui usuários. Peça a um administrador para registrar o seu acesso.',
      );
    }

    return this.createUsuario(data);
  }

  private async createUsuario(data: Required<Omit<RegisterData, 'papel'>> & { papel: Papel }): Promise<AuthResult> {
    const empresa = await this.empresaRepository.findById(data.empresaId);
    if (!empresa) {
      throw new NotFoundError(`Empresa com id "${data.empresaId}" não encontrada.`);
    }

    const existing = await this.usuarioRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`Já existe um usuário com o e-mail ${data.email}.`);
    }

    const senhaHash = await this.hasher.hash(data.senha);
    const usuario = await this.usuarioRepository.create({
      empresaId: data.empresaId,
      nome: data.nome,
      email: data.email,
      senhaHash,
      papel: data.papel,
    });

    return this.buildResult(usuario);
  }

  async login(raw: LoginData): Promise<AuthResult> {
    const data = validateLogin(raw);

    const usuario = await this.usuarioRepository.findByEmail(data.email);
    // Mensagem genérica para não revelar se o e-mail existe.
    const credenciaisInvalidas = new UnauthorizedError('E-mail ou senha inválidos.');
    if (!usuario) {
      throw credenciaisInvalidas;
    }

    const senhaConfere = await this.hasher.compare(data.senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw credenciaisInvalidas;
    }

    return this.buildResult(usuario);
  }

  async getById(id: string): Promise<PublicUsuario> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    return toPublic(usuario);
  }

  private buildResult(usuario: Usuario): AuthResult {
    const token = this.tokenService.sign({
      sub: usuario.id,
      empresaId: usuario.empresaId,
      papel: usuario.papel,
    });
    return { token, usuario: toPublic(usuario) };
  }
}

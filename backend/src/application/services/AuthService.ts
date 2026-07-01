import type {
  AuthResult,
  LoginData,
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

  async register(raw: RegisterData): Promise<AuthResult> {
    const data = validateRegister(raw);

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

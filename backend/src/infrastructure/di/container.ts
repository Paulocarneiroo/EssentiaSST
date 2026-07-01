import { AuthService } from '../../application/services/AuthService.js';
import { ColaboradorService } from '../../application/services/ColaboradorService.js';
import { EmpresaService } from '../../application/services/EmpresaService.js';
import { ColaboradorRepositoryPrisma } from '../repositories/ColaboradorRepositoryPrisma.js';
import { EmpresaRepositoryPrisma } from '../repositories/EmpresaRepositoryPrisma.js';
import { UsuarioRepositoryPrisma } from '../repositories/UsuarioRepositoryPrisma.js';
import { BcryptPasswordHasher } from '../security/BcryptPasswordHasher.js';
import { JwtTokenService } from '../security/JwtTokenService.js';

const empresaRepository = new EmpresaRepositoryPrisma();
const colaboradorRepository = new ColaboradorRepositoryPrisma();
const usuarioRepository = new UsuarioRepositoryPrisma();

const passwordHasher = new BcryptPasswordHasher();
export const tokenService = new JwtTokenService();

export const empresaService = new EmpresaService(empresaRepository);
export const colaboradorService = new ColaboradorService(colaboradorRepository, empresaRepository);
export const authService = new AuthService(
  usuarioRepository,
  empresaRepository,
  passwordHasher,
  tokenService,
);

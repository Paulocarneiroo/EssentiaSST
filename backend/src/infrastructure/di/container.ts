import type { IClienteESocial } from '../../application/ports/IClienteESocial.js';
import { AsoService } from '../../application/services/AsoService.js';
import { AuthService } from '../../application/services/AuthService.js';
import { ColaboradorService } from '../../application/services/ColaboradorService.js';
import { EmpresaService } from '../../application/services/EmpresaService.js';
import { MontadorXMLeSocial } from '../../application/services/MontadorXMLeSocial.js';
import { RiscoService } from '../../application/services/RiscoService.js';
import { ServicoEnvioESocial } from '../../application/services/ServicoEnvioESocial.js';
import { env } from '../../config/env.js';
import { ClienteESocialSandbox } from '../esocial/ClienteESocialSandbox.js';
import { ClienteWSeSocialGovBr } from '../esocial/ClienteWSeSocialGovBr.js';
import { ValidadorSchemaS12 } from '../esocial/ValidadorSchemaS12.js';
import { AsoRepositoryPrisma } from '../repositories/AsoRepositoryPrisma.js';
import { ColaboradorRepositoryPrisma } from '../repositories/ColaboradorRepositoryPrisma.js';
import { EmpresaRepositoryPrisma } from '../repositories/EmpresaRepositoryPrisma.js';
import { EventoESocialRepositoryPrisma } from '../repositories/EventoESocialRepositoryPrisma.js';
import { RiscoRepositoryPrisma } from '../repositories/RiscoRepositoryPrisma.js';
import { UsuarioRepositoryPrisma } from '../repositories/UsuarioRepositoryPrisma.js';
import { BcryptPasswordHasher } from '../security/BcryptPasswordHasher.js';
import { JwtTokenService } from '../security/JwtTokenService.js';

const empresaRepository = new EmpresaRepositoryPrisma();
const colaboradorRepository = new ColaboradorRepositoryPrisma();
const usuarioRepository = new UsuarioRepositoryPrisma();
const asoRepository = new AsoRepositoryPrisma();
const riscoRepository = new RiscoRepositoryPrisma();
const eventoRepository = new EventoESocialRepositoryPrisma();

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

export const asoService = new AsoService(asoRepository, colaboradorRepository);
export const riscoService = new RiscoService(riscoRepository);

// H3.5: o ambiente e o cliente vêm da configuração; a regra de negócio não muda.
const clienteESocial: IClienteESocial =
  env.esocial.cliente === 'govbr'
    ? new ClienteWSeSocialGovBr()
    : new ClienteESocialSandbox(env.esocial.taxaRejeicaoSandbox);

const montadorXml = new MontadorXMLeSocial(new ValidadorSchemaS12());

export const servicoEnvioESocial = new ServicoEnvioESocial(
  eventoRepository,
  asoRepository,
  riscoRepository,
  colaboradorRepository,
  empresaRepository,
  montadorXml,
  clienteESocial,
  env.esocial.ambiente,
);

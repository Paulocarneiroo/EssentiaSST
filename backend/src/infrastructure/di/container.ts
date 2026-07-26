import type { IClienteESocial } from '../../application/ports/IClienteESocial.js';
import { AcidenteService } from '../../application/services/AcidenteService.js';
import { AptidaoService } from '../../application/services/AptidaoService.js';
import { AsoService } from '../../application/services/AsoService.js';
import { AuthService } from '../../application/services/AuthService.js';
import { ColaboradorService } from '../../application/services/ColaboradorService.js';
import { EmpresaService } from '../../application/services/EmpresaService.js';
import { GeradorRelatorioPGR } from '../../application/services/GeradorRelatorioPGR.js';
import { MontadorXMLeSocial } from '../../application/services/MontadorXMLeSocial.js';
import { RiscoService } from '../../application/services/RiscoService.js';
import { ServicoEnvioESocial } from '../../application/services/ServicoEnvioESocial.js';
import { env } from '../../config/env.js';
import { ClienteESocialSandbox } from '../esocial/ClienteESocialSandbox.js';
import { ClienteWSeSocialGovBr } from '../esocial/ClienteWSeSocialGovBr.js';
import { ValidadorSchemaS12 } from '../esocial/ValidadorSchemaS12.js';
import { ExportadorHTMLRelatorio } from '../relatorios/ExportadorHTMLRelatorio.js';
import { ExportadorJSONRelatorio } from '../relatorios/ExportadorJSONRelatorio.js';
import { AcidenteRepositoryPrisma } from '../repositories/AcidenteRepositoryPrisma.js';
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
const acidenteRepository = new AcidenteRepositoryPrisma();
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
export const aptidaoService = new AptidaoService(asoRepository);
export const acidenteService = new AcidenteService(acidenteRepository, colaboradorRepository);

/**
 * O formato do PGR é escolhido na borda (query `?formato=`); o gerador continua
 * dependendo apenas de `IExportadorRelatorio` — é o DIP em uso.
 */
const exportadoresRelatorio = {
  html: new ExportadorHTMLRelatorio(),
  json: new ExportadorJSONRelatorio(),
} as const;

export type FormatoRelatorio = keyof typeof exportadoresRelatorio;

export const FORMATOS_RELATORIO = Object.keys(exportadoresRelatorio) as FormatoRelatorio[];

export const criarGeradorRelatorioPGR = (formato: FormatoRelatorio): GeradorRelatorioPGR =>
  new GeradorRelatorioPGR(exportadoresRelatorio[formato]);

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
  acidenteRepository,
  colaboradorRepository,
  empresaRepository,
  montadorXml,
  clienteESocial,
  env.esocial.ambiente,
);

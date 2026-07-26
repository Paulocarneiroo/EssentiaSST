import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../../../domain/entities/Colaborador.js';
import type { Aso, CreateAsoData, UpdateAsoData } from '../../../domain/entities/Aso.js';
import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../../../domain/entities/Empresa.js';
import type { CreateRiscoData, Risco, UpdateRiscoData } from '../../../domain/entities/Risco.js';
import type { AuthTokenPayload, CreateUsuarioData, Usuario } from '../../../domain/entities/Usuario.js';
import type { IAsoRepository } from '../../ports/IAsoRepository.js';
import type { IColaboradorRepository } from '../../ports/IColaboradorRepository.js';
import type { IEmpresaRepository } from '../../ports/IEmpresaRepository.js';
import type { IPasswordHasher } from '../../ports/IPasswordHasher.js';
import type { IRiscoRepository } from '../../ports/IRiscoRepository.js';
import type { ITokenService } from '../../ports/ITokenService.js';
import type { IUsuarioRepository } from '../../ports/IUsuarioRepository.js';

/**
 * Implementações completas em memória dos repositórios e serviços de infraestrutura.
 * É o que o DIP habilita: exercitar as regras de isolamento entre tenants e de
 * autenticação sem banco, sem bcrypt lento e sem relógio real.
 */

const agora = (): Date => new Date('2026-03-10T12:00:00.000Z');

export class EmpresaRepositoryMemoria implements IEmpresaRepository {
  private sequencial = 0;

  constructor(readonly empresas: Empresa[] = []) {}

  async findAll(): Promise<Empresa[]> {
    return [...this.empresas];
  }

  async findById(id: string): Promise<Empresa | null> {
    return this.empresas.find((e) => e.id === id) ?? null;
  }

  async findByCnpj(cnpj: string): Promise<Empresa | null> {
    return this.empresas.find((e) => e.cnpj === cnpj) ?? null;
  }

  async create(data: CreateEmpresaData): Promise<Empresa> {
    this.sequencial += 1;
    const empresa: Empresa = {
      id: `empresa-${this.sequencial}`,
      ...data,
      createdAt: agora(),
      updatedAt: agora(),
    };
    this.empresas.push(empresa);
    return empresa;
  }

  async update(id: string, data: UpdateEmpresaData): Promise<Empresa | null> {
    const indice = this.empresas.findIndex((e) => e.id === id);
    const atual = this.empresas[indice];
    if (!atual) {
      return null;
    }
    const atualizada: Empresa = { ...atual, ...data, updatedAt: agora() };
    this.empresas[indice] = atualizada;
    return atualizada;
  }

  async delete(id: string): Promise<boolean> {
    const indice = this.empresas.findIndex((e) => e.id === id);
    if (indice < 0) {
      return false;
    }
    this.empresas.splice(indice, 1);
    return true;
  }
}

export class ColaboradorRepositoryMemoria implements IColaboradorRepository {
  private sequencial = 0;

  constructor(readonly colaboradores: Colaborador[] = []) {}

  async findAll(empresaId?: string): Promise<Colaborador[]> {
    return this.colaboradores.filter((c) => empresaId === undefined || c.empresaId === empresaId);
  }

  async findById(id: string): Promise<Colaborador | null> {
    return this.colaboradores.find((c) => c.id === id) ?? null;
  }

  async findByCpfAndEmpresa(cpf: string, empresaId: string): Promise<Colaborador | null> {
    return this.colaboradores.find((c) => c.cpf === cpf && c.empresaId === empresaId) ?? null;
  }

  async create(data: CreateColaboradorData): Promise<Colaborador> {
    this.sequencial += 1;
    const colaborador: Colaborador = {
      id: `colaborador-${this.sequencial}`,
      empresaId: data.empresaId,
      cpf: data.cpf,
      nome: data.nome,
      dataNascimento: new Date(data.dataNascimento),
      cargo: data.cargo,
      dataAdmissao: new Date(data.dataAdmissao),
      dataDemissao: data.dataDemissao ? new Date(data.dataDemissao) : null,
      createdAt: agora(),
      updatedAt: agora(),
    };
    this.colaboradores.push(colaborador);
    return colaborador;
  }

  async update(id: string, data: UpdateColaboradorData): Promise<Colaborador | null> {
    const indice = this.colaboradores.findIndex((c) => c.id === id);
    const atual = this.colaboradores[indice];
    if (!atual) {
      return null;
    }
    const atualizado: Colaborador = {
      ...atual,
      ...(data.empresaId !== undefined && { empresaId: data.empresaId }),
      ...(data.cpf !== undefined && { cpf: data.cpf }),
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.cargo !== undefined && { cargo: data.cargo }),
      ...(data.dataNascimento !== undefined && { dataNascimento: new Date(data.dataNascimento) }),
      ...(data.dataAdmissao !== undefined && { dataAdmissao: new Date(data.dataAdmissao) }),
      ...(data.dataDemissao !== undefined && {
        dataDemissao: data.dataDemissao ? new Date(data.dataDemissao) : null,
      }),
      updatedAt: agora(),
    };
    this.colaboradores[indice] = atualizado;
    return atualizado;
  }

  async delete(id: string): Promise<boolean> {
    const indice = this.colaboradores.findIndex((c) => c.id === id);
    if (indice < 0) {
      return false;
    }
    this.colaboradores.splice(indice, 1);
    return true;
  }
}

export class AsoRepositoryMemoria implements IAsoRepository {
  private sequencial = 0;

  constructor(
    readonly asos: Aso[] = [],
    private readonly colaboradores: Colaborador[] = [],
  ) {}

  async findAllByEmpresa(empresaId: string): Promise<Aso[]> {
    const doTenant = new Set(
      this.colaboradores.filter((c) => c.empresaId === empresaId).map((c) => c.id),
    );
    return this.asos.filter((a) => doTenant.has(a.colaboradorId));
  }

  async findById(id: string): Promise<Aso | null> {
    return this.asos.find((a) => a.id === id) ?? null;
  }

  async findByColaborador(colaboradorId: string): Promise<Aso[]> {
    return this.asos.filter((a) => a.colaboradorId === colaboradorId);
  }

  async create(data: CreateAsoData): Promise<Aso> {
    this.sequencial += 1;
    const aso: Aso = {
      id: `aso-${this.sequencial}`,
      colaboradorId: data.colaboradorId,
      tipoExame: data.tipoExame,
      dataExame: new Date(data.dataExame),
      resultado: data.resultado,
      medico: data.medico,
      crm: data.crm,
      createdAt: agora(),
      updatedAt: agora(),
    };
    this.asos.push(aso);
    return aso;
  }

  async update(id: string, data: UpdateAsoData): Promise<Aso | null> {
    const indice = this.asos.findIndex((a) => a.id === id);
    const atual = this.asos[indice];
    if (!atual) {
      return null;
    }
    const atualizado: Aso = {
      ...atual,
      ...(data.tipoExame !== undefined && { tipoExame: data.tipoExame }),
      ...(data.resultado !== undefined && { resultado: data.resultado }),
      ...(data.medico !== undefined && { medico: data.medico }),
      ...(data.crm !== undefined && { crm: data.crm }),
      ...(data.dataExame !== undefined && { dataExame: new Date(data.dataExame) }),
      updatedAt: agora(),
    };
    this.asos[indice] = atualizado;
    return atualizado;
  }

  async delete(id: string): Promise<boolean> {
    const indice = this.asos.findIndex((a) => a.id === id);
    if (indice < 0) {
      return false;
    }
    this.asos.splice(indice, 1);
    return true;
  }
}

export class RiscoRepositoryMemoria implements IRiscoRepository {
  private sequencial = 0;

  constructor(readonly riscos: Risco[] = []) {}

  async findAll(empresaId: string): Promise<Risco[]> {
    return this.riscos.filter((r) => r.empresaId === empresaId);
  }

  async findById(id: string): Promise<Risco | null> {
    return this.riscos.find((r) => r.id === id) ?? null;
  }

  async create(data: CreateRiscoData): Promise<Risco> {
    this.sequencial += 1;
    const risco: Risco = {
      id: `risco-${this.sequencial}`,
      ...data,
      createdAt: agora(),
      updatedAt: agora(),
    };
    this.riscos.push(risco);
    return risco;
  }

  async update(id: string, data: UpdateRiscoData): Promise<Risco | null> {
    const indice = this.riscos.findIndex((r) => r.id === id);
    const atual = this.riscos[indice];
    if (!atual) {
      return null;
    }
    const atualizado: Risco = { ...atual, ...data, updatedAt: agora() };
    this.riscos[indice] = atualizado;
    return atualizado;
  }

  async delete(id: string): Promise<boolean> {
    const indice = this.riscos.findIndex((r) => r.id === id);
    if (indice < 0) {
      return false;
    }
    this.riscos.splice(indice, 1);
    return true;
  }
}

export class UsuarioRepositoryMemoria implements IUsuarioRepository {
  private sequencial = 0;

  constructor(readonly usuarios: Usuario[] = []) {}

  async findById(id: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.email === email) ?? null;
  }

  async countByEmpresa(empresaId: string): Promise<number> {
    return this.usuarios.filter((u) => u.empresaId === empresaId).length;
  }

  async create(data: CreateUsuarioData): Promise<Usuario> {
    this.sequencial += 1;
    const usuario: Usuario = {
      id: `usuario-${this.sequencial}`,
      ...data,
      createdAt: agora(),
      updatedAt: agora(),
    };
    this.usuarios.push(usuario);
    return usuario;
  }
}

/** Hasher determinístico: rápido e verificável, sem o custo do bcrypt nos testes. */
export class HasherFake implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hash(${plain})`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hash(${plain})`;
  }
}

/** Token que carrega o payload em texto — permite inspecionar o que foi assinado. */
export class TokenServiceFake implements ITokenService {
  readonly assinados: AuthTokenPayload[] = [];

  sign(payload: AuthTokenPayload): string {
    this.assinados.push(payload);
    return `token:${JSON.stringify(payload)}`;
  }

  verify(token: string): AuthTokenPayload {
    return JSON.parse(token.replace(/^token:/, '')) as AuthTokenPayload;
  }
}

import type { Acidente } from '../../../domain/entities/Acidente.js';
import type { Aso } from '../../../domain/entities/Aso.js';
import type { Colaborador } from '../../../domain/entities/Colaborador.js';
import type { Empresa } from '../../../domain/entities/Empresa.js';
import type {
  CreateEventoESocialData,
  EventoESocial,
  UpdateEventoESocialData,
} from '../../../domain/entities/EventoESocial.js';
import type { Risco } from '../../../domain/entities/Risco.js';
import type { IAcidenteRepository } from '../../ports/IAcidenteRepository.js';
import type { IAsoRepository } from '../../ports/IAsoRepository.js';
import type { IColaboradorRepository } from '../../ports/IColaboradorRepository.js';
import type { IEmpresaRepository } from '../../ports/IEmpresaRepository.js';
import type { IEventoESocialRepository } from '../../ports/IEventoESocialRepository.js';
import type { IRiscoRepository } from '../../ports/IRiscoRepository.js';

export const TENANT_A = '11111111-1111-1111-1111-111111111111';
export const TENANT_B = '22222222-2222-2222-2222-222222222222';

const agora = new Date('2026-03-10T12:00:00.000Z');

export const empresaA: Empresa = {
  id: TENANT_A,
  cnpj: '11222333000181',
  razaoSocial: 'Empresa Exemplo LTDA',
  nomeFantasia: 'Exemplo SST',
  cnae: '6201500',
  grauRisco: 2,
  createdAt: agora,
  updatedAt: agora,
};

export const colaboradorA: Colaborador = {
  id: '33333333-3333-3333-3333-333333333333',
  empresaId: TENANT_A,
  cpf: '12345678909',
  nome: 'Maria Silva',
  dataNascimento: new Date('1990-05-15'),
  cargo: 'Analista de SST',
  dataAdmissao: new Date('2024-01-10'),
  dataDemissao: null,
  createdAt: agora,
  updatedAt: agora,
};

export const asoA: Aso = {
  id: '44444444-4444-4444-4444-444444444444',
  colaboradorId: colaboradorA.id,
  tipoExame: 'PERIODICO',
  dataExame: new Date('2026-02-01'),
  resultado: 'APTO',
  medico: 'Dr. João Souza',
  crm: 'CRM-PE 12345',
  createdAt: agora,
  updatedAt: agora,
};

export const riscoA: Risco = {
  id: '55555555-5555-5555-5555-555555555555',
  empresaId: TENANT_A,
  descricao: 'Ruído contínuo acima de 85 dB(A) no setor de produção',
  tipo: 'FISICO',
  severidade: 4,
  probabilidade: 3,
  createdAt: agora,
  updatedAt: agora,
};

export const acidenteA: Acidente = {
  id: '66666666-6666-6666-6666-666666666666',
  colaboradorId: colaboradorA.id,
  dataAcidente: new Date('2026-03-02T00:00:00.000Z'),
  horaAcidente: '1430',
  horasTrabalhadasAntes: '0600',
  tipoAcidente: 'TIPICO',
  tipoCat: 'INICIAL',
  obito: false,
  dataObito: null,
  comunicadoPolicia: false,
  localAcidente: 'Setor de produção, linha 2',
  parteAtingida: 'MAO',
  agenteCausador: 'MAQUINA',
  tipoLesao: 'CORTE',
  descricao: 'Corte na mão direita ao operar a prensa sem proteção de zona.',
  cid: 'S61.0',
  dataAtendimento: new Date('2026-03-02T00:00:00.000Z'),
  horaAtendimento: '1520',
  houveInternacao: false,
  houveAfastamento: true,
  duracaoTratamentoDias: 15,
  medico: 'Dra. Carla Lima',
  crm: 'CRM-PE 54321',
  ufCrm: 'PE',
  createdAt: agora,
  updatedAt: agora,
};

/** Repositórios em memória — exatamente o cenário que o DIP habilita. */
export class EmpresaRepositoryFake implements Pick<IEmpresaRepository, 'findById'> {
  constructor(private readonly empresas: Empresa[]) {}
  async findById(id: string): Promise<Empresa | null> {
    return this.empresas.find((e) => e.id === id) ?? null;
  }
}

export class ColaboradorRepositoryFake implements Pick<IColaboradorRepository, 'findById'> {
  constructor(private readonly colaboradores: Colaborador[]) {}
  async findById(id: string): Promise<Colaborador | null> {
    return this.colaboradores.find((c) => c.id === id) ?? null;
  }
}

export class AsoRepositoryFake implements Pick<IAsoRepository, 'findById'> {
  constructor(private readonly asos: Aso[]) {}
  async findById(id: string): Promise<Aso | null> {
    return this.asos.find((a) => a.id === id) ?? null;
  }
}

export class AcidenteRepositoryFake implements Pick<IAcidenteRepository, 'findById'> {
  constructor(private readonly acidentes: Acidente[]) {}
  async findById(id: string): Promise<Acidente | null> {
    return this.acidentes.find((a) => a.id === id) ?? null;
  }
}

export class RiscoRepositoryFake implements Pick<IRiscoRepository, 'findById'> {
  constructor(private readonly riscos: Risco[]) {}
  async findById(id: string): Promise<Risco | null> {
    return this.riscos.find((r) => r.id === id) ?? null;
  }
}

export class EventoRepositoryFake implements IEventoESocialRepository {
  readonly eventos: EventoESocial[] = [];
  private sequencial = 0;

  async findAll(empresaId: string): Promise<EventoESocial[]> {
    return this.eventos.filter((e) => e.empresaId === empresaId);
  }

  async findById(id: string): Promise<EventoESocial | null> {
    return this.eventos.find((e) => e.id === id) ?? null;
  }

  async create(data: CreateEventoESocialData): Promise<EventoESocial> {
    this.sequencial += 1;
    const evento: EventoESocial = {
      id: `evento-${this.sequencial}`,
      empresaId: data.empresaId,
      colaboradorId: data.colaboradorId,
      asoId: data.asoId,
      riscoId: data.riscoId,
      acidenteId: data.acidenteId,
      tipoEvento: data.tipoEvento,
      payloadXml: data.payloadXml,
      status: 'PENDENTE',
      ambiente: data.ambiente,
      protocolo: null,
      mensagemErro: null,
      dataEnvio: null,
      tentativas: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.eventos.push(evento);
    return evento;
  }

  async update(id: string, data: UpdateEventoESocialData): Promise<EventoESocial | null> {
    const indice = this.eventos.findIndex((e) => e.id === id);
    const atual = this.eventos[indice];
    if (!atual) {
      return null;
    }
    const atualizado: EventoESocial = { ...atual, ...data, updatedAt: new Date() };
    this.eventos[indice] = atualizado;
    return atualizado;
  }
}

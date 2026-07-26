import type { Acidente, CreateAcidenteData } from '../../domain/entities/Acidente.js';
import type { Colaborador } from '../../domain/entities/Colaborador.js';
import { AppError } from '../../domain/errors/AppError.js';
import type { IAcidenteRepository } from '../ports/IAcidenteRepository.js';
import { AcidenteService } from './AcidenteService.js';
import { TENANT_A, TENANT_B, acidenteA, colaboradorA } from './__fixtures__/esocial.js';
import { ColaboradorRepositoryMemoria } from './__fixtures__/repositorios.js';

const colaboradorB: Colaborador = {
  ...colaboradorA,
  id: 'colaborador-b',
  empresaId: TENANT_B,
  cpf: '98765432100',
};

const acidenteB: Acidente = { ...acidenteA, id: 'acidente-b', colaboradorId: colaboradorB.id };

const NOVO: CreateAcidenteData = {
  colaboradorId: colaboradorA.id,
  dataAcidente: '2026-03-02',
  horaAcidente: '1430',
  horasTrabalhadasAntes: '0600',
  tipoAcidente: 'TIPICO',
  localAcidente: 'Setor de produção, linha 2',
  parteAtingida: 'MAO',
  agenteCausador: 'MAQUINA',
  tipoLesao: 'CORTE',
  descricao: 'Corte na mão direita ao operar a prensa.',
  dataAtendimento: '2026-03-02',
  horaAtendimento: '1520',
  medico: 'Dra. Carla Lima',
  crm: 'CRM-PE 54321',
  ufCrm: 'pe',
};

class AcidenteRepositoryMemoria implements IAcidenteRepository {
  private sequencial = 0;

  constructor(
    readonly acidentes: Acidente[] = [],
    private readonly colaboradores: Colaborador[] = [],
  ) {}

  async findAllByEmpresa(empresaId: string): Promise<Acidente[]> {
    const doTenant = new Set(
      this.colaboradores.filter((c) => c.empresaId === empresaId).map((c) => c.id),
    );
    return this.acidentes.filter((a) => doTenant.has(a.colaboradorId));
  }

  async findById(id: string): Promise<Acidente | null> {
    return this.acidentes.find((a) => a.id === id) ?? null;
  }

  async findByColaborador(colaboradorId: string): Promise<Acidente[]> {
    return this.acidentes.filter((a) => a.colaboradorId === colaboradorId);
  }

  async create(data: CreateAcidenteData): Promise<Acidente> {
    this.sequencial += 1;
    const acidente: Acidente = {
      ...acidenteA,
      ...data,
      id: `acidente-${this.sequencial}`,
      dataAcidente: new Date(data.dataAcidente),
      dataAtendimento: new Date(data.dataAtendimento),
      dataObito: data.dataObito ? new Date(data.dataObito) : null,
      tipoCat: data.tipoCat ?? 'INICIAL',
      obito: data.obito ?? false,
      cid: data.cid ?? null,
    };
    this.acidentes.push(acidente);
    return acidente;
  }

  async update(id: string, data: Partial<CreateAcidenteData>): Promise<Acidente | null> {
    const indice = this.acidentes.findIndex((a) => a.id === id);
    const atual = this.acidentes[indice];
    if (!atual) {
      return null;
    }
    const atualizado: Acidente = {
      ...atual,
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.cid !== undefined && { cid: data.cid }),
    };
    this.acidentes[indice] = atualizado;
    return atualizado;
  }

  async delete(id: string): Promise<boolean> {
    const indice = this.acidentes.findIndex((a) => a.id === id);
    if (indice < 0) {
      return false;
    }
    this.acidentes.splice(indice, 1);
    return true;
  }
}

const montarCenario = () => {
  const colaboradores = [colaboradorA, colaboradorB];
  const acidentes = new AcidenteRepositoryMemoria([acidenteA, acidenteB], colaboradores);
  return {
    servico: new AcidenteService(acidentes, new ColaboradorRepositoryMemoria(colaboradores)),
    acidentes,
  };
};

const capturar = async (acao: Promise<unknown>): Promise<AppError> => {
  try {
    await acao;
  } catch (error) {
    if (error instanceof AppError) {
      return error;
    }
    throw error;
  }
  throw new Error('Esperava um AppError, mas a operação teve sucesso.');
};

describe('AcidenteService — registro do acidente', () => {
  it('registra o acidente normalizando a UF do CRM', async () => {
    const { servico } = montarCenario();

    const criado = await servico.create(NOVO, TENANT_A);

    expect(criado.ufCrm).toBe('PE');
    expect(criado.tipoCat).toBe('INICIAL');
  });

  it('marca a CAT como comunicação de óbito quando há óbito', async () => {
    const { servico } = montarCenario();

    const criado = await servico.create(
      { ...NOVO, obito: true, dataObito: '2026-03-03' },
      TENANT_A,
    );

    expect(criado.tipoCat).toBe('COMUNICACAO_OBITO');
  });

  it('exige a data do óbito quando obito = true', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.create({ ...NOVO, obito: true }, TENANT_A));

    expect(erro.status).toBe(400);
    expect(erro.message).toContain('data do óbito');
  });

  it('recusa hora fora do formato HHMM', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.create({ ...NOVO, horaAcidente: '14:30' }, TENANT_A));

    expect(erro.status).toBe(400);
    expect(erro.message).toContain('HHMM');
  });

  it('recusa atendimento anterior ao acidente', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(
      servico.create({ ...NOVO, dataAtendimento: '2026-03-01' }, TENANT_A),
    );

    expect(erro.status).toBe(400);
  });

  it('recusa acidente anterior à admissão do colaborador', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(
      servico.create(
        { ...NOVO, dataAcidente: '2020-01-05', dataAtendimento: '2020-01-05' },
        TENANT_A,
      ),
    );

    expect(erro.status).toBe(400);
    expect(erro.message).toContain('admissão');
  });

  it('recusa CID fora do formato CID-10', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.create({ ...NOVO, cid: 'lesão na mão' }, TENANT_A));

    expect(erro.status).toBe(400);
  });
});

describe('AcidenteService — isolamento entre empresas (H1.3)', () => {
  it('a listagem alcança apenas acidentes de colaboradores do tenant', async () => {
    const { servico } = montarCenario();

    const lista = await servico.list(TENANT_A);

    expect(lista.map((a) => a.id)).toEqual([acidenteA.id]);
  });

  it('não lê acidente de colaborador de outra empresa', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.getById(acidenteB.id, TENANT_A));

    expect(erro.status).toBe(404);
  });

  it('não registra acidente para colaborador de outra empresa', async () => {
    const { servico, acidentes } = montarCenario();

    const erro = await capturar(
      servico.create({ ...NOVO, colaboradorId: colaboradorB.id }, TENANT_A),
    );

    expect(erro.status).toBe(404);
    expect(acidentes.acidentes).toHaveLength(2);
  });

  it('não exclui acidente de outra empresa', async () => {
    const { servico, acidentes } = montarCenario();

    const erro = await capturar(servico.remove(acidenteB.id, TENANT_A));

    expect(erro.status).toBe(404);
    expect(await acidentes.findById(acidenteB.id)).not.toBeNull();
  });
});

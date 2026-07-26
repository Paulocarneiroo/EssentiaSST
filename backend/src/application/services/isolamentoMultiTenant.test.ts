import type { Aso } from '../../domain/entities/Aso.js';
import type { Colaborador } from '../../domain/entities/Colaborador.js';
import type { Empresa } from '../../domain/entities/Empresa.js';
import type { Risco } from '../../domain/entities/Risco.js';
import { AppError } from '../../domain/errors/AppError.js';
import { AsoService } from './AsoService.js';
import { EmpresaService } from './EmpresaService.js';
import { RiscoService } from './RiscoService.js';
import { TENANT_A, TENANT_B, asoA, colaboradorA, empresaA, riscoA } from './__fixtures__/esocial.js';
import {
  AsoRepositoryMemoria,
  ColaboradorRepositoryMemoria,
  EmpresaRepositoryMemoria,
  RiscoRepositoryMemoria,
} from './__fixtures__/repositorios.js';

/**
 * H1.3 — o isolamento entre tenants é transversal: vale para todos os recursos,
 * e recurso de outra empresa precisa ser indistinguível de recurso inexistente.
 */

const empresaB: Empresa = { ...empresaA, id: TENANT_B, cnpj: '98765432000198' };

const colaboradorB: Colaborador = {
  ...colaboradorA,
  id: 'colaborador-b',
  empresaId: TENANT_B,
  cpf: '98765432100',
};

const riscoB: Risco = { ...riscoA, id: 'risco-b', empresaId: TENANT_B };

const asoB: Aso = { ...asoA, id: 'aso-b', colaboradorId: colaboradorB.id };

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

const empresaServiceCom = () =>
  new EmpresaService(new EmpresaRepositoryMemoria([empresaA, empresaB]));

const riscoServiceCom = () => {
  const riscos = new RiscoRepositoryMemoria([riscoA, riscoB]);
  return { servico: new RiscoService(riscos), riscos };
};

const asoServiceCom = () => {
  const colaboradores = [colaboradorA, colaboradorB];
  const asos = new AsoRepositoryMemoria([asoA, asoB], colaboradores);
  return {
    servico: new AsoService(asos, new ColaboradorRepositoryMemoria(colaboradores)),
    asos,
  };
};

describe('EmpresaService — isolamento', () => {
  it('a listagem devolve apenas a própria empresa', async () => {
    const lista = await empresaServiceCom().list(TENANT_A);

    expect(lista.map((e) => e.id)).toEqual([TENANT_A]);
  });

  it('consultar outra empresa responde "não encontrada"', async () => {
    const erro = await capturar(empresaServiceCom().getById(TENANT_B, TENANT_A));

    expect(erro.status).toBe(404);
  });

  it('não edita nem exclui outra empresa', async () => {
    const servico = empresaServiceCom();

    expect((await capturar(servico.update(TENANT_B, { razaoSocial: 'X' }, TENANT_A))).status).toBe(
      404,
    );
    expect((await capturar(servico.remove(TENANT_B, TENANT_A))).status).toBe(404);
  });
});

describe('RiscoService — isolamento', () => {
  it('a listagem devolve apenas riscos do próprio tenant', async () => {
    const { servico } = riscoServiceCom();

    const lista = await servico.list(TENANT_A);

    expect(lista.map((r) => r.id)).toEqual([riscoA.id]);
  });

  it('o cadastro ignora o empresaId do corpo e usa o do token', async () => {
    const { servico } = riscoServiceCom();

    const criado = await servico.create(
      {
        empresaId: TENANT_B,
        descricao: 'Iluminação insuficiente',
        tipo: 'FISICO',
        severidade: 2,
        probabilidade: 3,
      },
      TENANT_A,
    );

    expect(criado.empresaId).toBe(TENANT_A);
  });

  it('não lê, edita nem exclui risco de outro tenant', async () => {
    const { servico, riscos } = riscoServiceCom();

    expect((await capturar(servico.getById(riscoB.id, TENANT_A))).status).toBe(404);
    expect((await capturar(servico.update(riscoB.id, { severidade: 1 }, TENANT_A))).status).toBe(
      404,
    );
    expect((await capturar(servico.remove(riscoB.id, TENANT_A))).status).toBe(404);
    expect(await riscos.findById(riscoB.id)).not.toBeNull();
  });
});

describe('AsoService — isolamento', () => {
  it('a listagem alcança apenas ASOs de colaboradores do tenant', async () => {
    const { servico } = asoServiceCom();

    const lista = await servico.list(TENANT_A);

    expect(lista.map((a) => a.id)).toEqual([asoA.id]);
  });

  it('não lê ASO de colaborador de outra empresa', async () => {
    const { servico } = asoServiceCom();

    const erro = await capturar(servico.getById(asoB.id, TENANT_A));

    expect(erro.status).toBe(404);
  });

  it('não cria ASO para colaborador de outra empresa', async () => {
    const { servico, asos } = asoServiceCom();

    const erro = await capturar(
      servico.create(
        {
          colaboradorId: colaboradorB.id,
          tipoExame: 'PERIODICO',
          dataExame: '2026-03-01',
          resultado: 'APTO',
          medico: 'Dra. Carla Lima',
          crm: 'CRM-PE 54321',
        },
        TENANT_A,
      ),
    );

    expect(erro.status).toBe(404);
    expect(asos.asos).toHaveLength(2);
  });

  it('o histórico por colaborador respeita o tenant', async () => {
    const { servico } = asoServiceCom();

    const erro = await capturar(servico.list(TENANT_A, colaboradorB.id));

    expect(erro.status).toBe(404);
  });
});

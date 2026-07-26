import type { Colaborador } from '../../domain/entities/Colaborador.js';
import type { Empresa } from '../../domain/entities/Empresa.js';
import { AppError } from '../../domain/errors/AppError.js';
import { ColaboradorService } from './ColaboradorService.js';
import { TENANT_A, TENANT_B, colaboradorA, empresaA } from './__fixtures__/esocial.js';
import {
  ColaboradorRepositoryMemoria,
  EmpresaRepositoryMemoria,
} from './__fixtures__/repositorios.js';

const empresaB: Empresa = { ...empresaA, id: TENANT_B, cnpj: '98765432000198' };

const colaboradorB: Colaborador = {
  ...colaboradorA,
  id: 'colaborador-do-tenant-b',
  empresaId: TENANT_B,
  cpf: '98765432100',
  nome: 'João Pereira',
};

const novoColaborador = {
  empresaId: TENANT_A,
  cpf: '11122233396',
  nome: 'Ana Costa',
  dataNascimento: '1995-08-20',
  cargo: 'Auxiliar de produção',
  dataAdmissao: '2025-06-01',
};

const montarCenario = () => {
  const colaboradores = new ColaboradorRepositoryMemoria([colaboradorA, colaboradorB]);
  const empresas = new EmpresaRepositoryMemoria([empresaA, empresaB]);
  return { servico: new ColaboradorService(colaboradores, empresas), colaboradores };
};

/** Erro esperado, capturado como `AppError` para inspecionar status e código. */
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

describe('ColaboradorService — H1.2 (gestão de colaboradores)', () => {
  it('rejeita CPF duplicado dentro da mesma empresa', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(
      servico.create({ ...novoColaborador, cpf: colaboradorA.cpf }, TENANT_A),
    );

    expect(erro.status).toBe(409);
  });

  it('permite o mesmo CPF em empresas diferentes', async () => {
    const { servico } = montarCenario();

    const criado = await servico.create({ ...novoColaborador, cpf: colaboradorA.cpf }, TENANT_B);

    expect(criado.empresaId).toBe(TENANT_B);
    expect(criado.cpf).toBe(colaboradorA.cpf);
  });

  it('rejeita CPF fora do formato de 11 dígitos', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.create({ ...novoColaborador, cpf: '123' }, TENANT_A));

    expect(erro.status).toBe(400);
  });

  it('rejeita data em formato inválido', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(
      servico.create({ ...novoColaborador, dataAdmissao: 'ontem' }, TENANT_A),
    );

    expect(erro.status).toBe(400);
  });

  it('desligamento grava a data de demissão e preserva o cadastro', async () => {
    const { servico, colaboradores } = montarCenario();

    const desligado = await servico.update(
      colaboradorA.id,
      { dataDemissao: '2026-03-01' },
      TENANT_A,
    );

    expect(desligado.dataDemissao).toEqual(new Date('2026-03-01'));
    expect(desligado.nome).toBe(colaboradorA.nome);
    expect(await colaboradores.findById(colaboradorA.id)).not.toBeNull();
  });

  it('recusa colaborador em empresa inexistente', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.create(novoColaborador, 'tenant-que-nao-existe'));

    expect(erro.status).toBe(404);
  });
});

describe('ColaboradorService — H1.3 (isolamento entre empresas)', () => {
  it('a listagem devolve apenas colaboradores do próprio tenant', async () => {
    const { servico } = montarCenario();

    const lista = await servico.list(TENANT_A);

    expect(lista.map((c) => c.id)).toEqual([colaboradorA.id]);
  });

  it('colaborador de outra empresa responde "não encontrado", não "proibido"', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.getById(colaboradorB.id, TENANT_A));

    // 404 em vez de 403: um 403 confirmaria que o recurso existe (H1.3).
    expect(erro.status).toBe(404);
  });

  it('o cadastro ignora o empresaId enviado no corpo e usa o do token', async () => {
    const { servico } = montarCenario();

    const criado = await servico.create({ ...novoColaborador, empresaId: TENANT_B }, TENANT_A);

    expect(criado.empresaId).toBe(TENANT_A);
  });

  it('a edição não permite mover o colaborador para outra empresa', async () => {
    const { servico } = montarCenario();

    const atualizado = await servico.update(
      colaboradorA.id,
      { empresaId: TENANT_B, cargo: 'Técnico de segurança' },
      TENANT_A,
    );

    expect(atualizado.empresaId).toBe(TENANT_A);
    expect(atualizado.cargo).toBe('Técnico de segurança');
  });

  it('não edita colaborador de outra empresa', async () => {
    const { servico, colaboradores } = montarCenario();

    const erro = await capturar(servico.update(colaboradorB.id, { nome: 'Invadido' }, TENANT_A));

    expect(erro.status).toBe(404);
    expect((await colaboradores.findById(colaboradorB.id))?.nome).toBe(colaboradorB.nome);
  });

  it('não exclui colaborador de outra empresa', async () => {
    const { servico, colaboradores } = montarCenario();

    const erro = await capturar(servico.remove(colaboradorB.id, TENANT_A));

    expect(erro.status).toBe(404);
    expect(await colaboradores.findById(colaboradorB.id)).not.toBeNull();
  });
});

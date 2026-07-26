import type { Aso } from '../../domain/entities/Aso.js';
import type { Colaborador } from '../../domain/entities/Colaborador.js';
import type { Empresa } from '../../domain/entities/Empresa.js';
import type { IAsoRepository } from '../ports/IAsoRepository.js';
import { AptidaoService } from './AptidaoService.js';
import { colaboradorA, empresaA } from './__fixtures__/esocial.js';

/** `RepositorioASOInMemory` do modelo — é o DIP que permite testar sem banco. */
class RepositorioASOInMemory implements Pick<IAsoRepository, 'findByColaborador'> {
  constructor(private readonly asos: Aso[]) {}
  async findByColaborador(colaboradorId: string): Promise<Aso[]> {
    return this.asos.filter((a) => a.colaboradorId === colaboradorId);
  }
}

const AGORA = new Date('2026-03-10T12:00:00.000Z');

const aso = (patch: Partial<Aso> = {}): Aso => ({
  id: 'aso-1',
  colaboradorId: colaboradorA.id,
  tipoExame: 'PERIODICO',
  dataExame: new Date('2026-02-01T00:00:00.000Z'),
  resultado: 'APTO',
  medico: 'Dr. João Souza',
  crm: 'CRM-PE 12345',
  createdAt: AGORA,
  updatedAt: AGORA,
  ...patch,
});

const comEmpresa = (grauRisco: number): Empresa => ({ ...empresaA, grauRisco });
const comNascimento = (iso: string): Colaborador => ({
  ...colaboradorA,
  dataNascimento: new Date(iso),
});

const avaliar = (asos: Aso[], colaborador = colaboradorA, empresa = empresaA) =>
  new AptidaoService(new RepositorioASOInMemory(asos)).avaliarAptidao(colaborador, empresa, AGORA);

describe('AptidaoService — situação do colaborador', () => {
  it('sem nenhum ASO, o colaborador não está apto', async () => {
    const avaliacao = await avaliar([]);

    expect(avaliacao.situacao).toBe('SEM_ASO');
    expect(avaliacao.apto).toBe(false);
    expect(avaliacao.proximoVencimento).toBeNull();
  });

  it('ASO APTO dentro da validade mantém o colaborador apto', async () => {
    const avaliacao = await avaliar([aso()]);

    expect(avaliacao.situacao).toBe('APTO');
    expect(avaliacao.apto).toBe(true);
    expect(avaliacao.asoVigente?.id).toBe('aso-1');
  });

  it('ASO INAPTO impede o trabalho e não gera vencimento', async () => {
    const avaliacao = await avaliar([aso({ resultado: 'INAPTO' })]);

    expect(avaliacao.situacao).toBe('INAPTO');
    expect(avaliacao.apto).toBe(false);
    expect(avaliacao.proximoVencimento).toBeNull();
  });

  it('APTO_COM_RESTRICOES continua apto, porém sinalizado', async () => {
    const avaliacao = await avaliar([aso({ resultado: 'APTO_COM_RESTRICOES' })]);

    expect(avaliacao.situacao).toBe('APTO_COM_RESTRICOES');
    expect(avaliacao.apto).toBe(true);
  });

  it('ASO fora do prazo deixa o colaborador VENCIDO, com dias negativos', async () => {
    const avaliacao = await avaliar([aso({ dataExame: new Date('2020-01-10T00:00:00.000Z') })]);

    expect(avaliacao.situacao).toBe('VENCIDO');
    expect(avaliacao.apto).toBe(false);
    expect(avaliacao.diasParaVencimento).toBeLessThan(0);
  });

  it('colaborador desligado não é avaliado como apto', async () => {
    const demitido: Colaborador = {
      ...colaboradorA,
      dataDemissao: new Date('2026-03-01T00:00:00.000Z'),
    };

    const avaliacao = await avaliar([aso()], demitido);

    expect(avaliacao.situacao).toBe('DESLIGADO');
    expect(avaliacao.apto).toBe(false);
  });

  it('ASO demissional não atesta aptidão para o trabalho', async () => {
    const avaliacao = await avaliar([aso({ tipoExame: 'DEMISSIONAL' })]);

    expect(avaliacao.situacao).toBe('SEM_ASO');
  });

  it('usa o exame mais recente, mesmo se o repositório devolver fora de ordem', async () => {
    const antigo = aso({ id: 'antigo', dataExame: new Date('2024-01-05T00:00:00.000Z') });
    const recente = aso({ id: 'recente', tipoExame: 'RETORNO_TRABALHO' });

    const avaliacao = await avaliar([recente, antigo]);

    expect(avaliacao.asoVigente?.id).toBe('recente');
  });
});

describe('AptidaoService — periodicidade do exame (NR-07)', () => {
  it('grau de risco 1 ou 2 renova a cada 24 meses', async () => {
    const avaliacao = await avaliar([aso()], colaboradorA, comEmpresa(2));

    expect(avaliacao.periodicidadeMeses).toBe(24);
    expect(avaliacao.proximoVencimento?.toISOString()).toBe('2028-02-01T00:00:00.000Z');
  });

  it('grau de risco 3 ou 4 renova a cada 12 meses', async () => {
    const avaliacao = await avaliar([aso()], colaboradorA, comEmpresa(4));

    expect(avaliacao.periodicidadeMeses).toBe(12);
    expect(avaliacao.proximoVencimento?.toISOString()).toBe('2027-02-01T00:00:00.000Z');
  });

  it('maior de 45 anos renova anualmente mesmo em grau de risco baixo', async () => {
    const avaliacao = await avaliar([aso()], comNascimento('1970-05-15'), comEmpresa(1));

    expect(avaliacao.periodicidadeMeses).toBe(12);
  });

  it('menor de 18 anos renova anualmente mesmo em grau de risco baixo', async () => {
    const avaliacao = await avaliar([aso()], comNascimento('2010-05-15'), comEmpresa(1));

    expect(avaliacao.periodicidadeMeses).toBe(12);
  });

  it('restrição reduz o intervalo para 12 meses', async () => {
    const avaliacao = await avaliar(
      [aso({ resultado: 'APTO_COM_RESTRICOES' })],
      colaboradorA,
      comEmpresa(1),
    );

    expect(avaliacao.periodicidadeMeses).toBe(12);
  });

  it('preserva o fim do mês ao somar o intervalo (29/02 → 28/02)', async () => {
    const avaliacao = await avaliar(
      [aso({ dataExame: new Date('2024-02-29T00:00:00.000Z') })],
      colaboradorA,
      comEmpresa(3),
    );

    expect(avaliacao.proximoVencimento?.toISOString()).toBe('2025-02-28T00:00:00.000Z');
  });

  it('proximoVencimento() devolve a mesma data da avaliação', async () => {
    const servico = new AptidaoService(new RepositorioASOInMemory([aso()]));

    const vencimento = await servico.proximoVencimento(colaboradorA, empresaA, AGORA);
    const { proximoVencimento } = await servico.avaliarAptidao(colaboradorA, empresaA, AGORA);

    expect(vencimento).toEqual(proximoVencimento);
  });
});

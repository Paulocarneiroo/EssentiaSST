import type { Risco } from '../../domain/entities/Risco.js';
import { ExportadorHTMLRelatorio } from '../../infrastructure/relatorios/ExportadorHTMLRelatorio.js';
import { ExportadorJSONRelatorio } from '../../infrastructure/relatorios/ExportadorJSONRelatorio.js';
import type {
  DocumentoExportado,
  IExportadorRelatorio,
  RelatorioPGR,
} from '../ports/IExportadorRelatorio.js';
import { GeradorRelatorioPGR } from './GeradorRelatorioPGR.js';
import { empresaA, riscoA } from './__fixtures__/esocial.js';

/** Exportador espião: prova que o gerador delega sem conhecer o formato. */
class ExportadorEspiao implements IExportadorRelatorio {
  recebido: RelatorioPGR | null = null;

  exportar(relatorio: RelatorioPGR): DocumentoExportado {
    this.recebido = relatorio;
    return { conteudo: 'ok', mimeType: 'text/plain', extensao: 'txt' };
  }
}

const AGORA = new Date('2026-03-10T12:00:00.000Z');

const risco = (patch: Partial<Risco> = {}): Risco => ({ ...riscoA, ...patch });

describe('GeradorRelatorioPGR — compilação do inventário', () => {
  it('calcula nível e classificação de cada risco', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorEspiao());

    const { itens } = gerador.compilar(empresaA, [risco({ severidade: 5, probabilidade: 5 })], AGORA);

    expect(itens[0]?.nivelRisco).toBe(25);
    expect(itens[0]?.classificacao).toBe('CRITICO');
  });

  it('ordena do maior para o menor nível de risco', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorEspiao());

    const { itens } = gerador.compilar(
      empresaA,
      [
        risco({ id: 'baixo', severidade: 1, probabilidade: 2 }),
        risco({ id: 'critico', severidade: 5, probabilidade: 5 }),
        risco({ id: 'moderado', severidade: 3, probabilidade: 3 }),
      ],
      AGORA,
    );

    expect(itens.map((i) => i.id)).toEqual(['critico', 'moderado', 'baixo']);
  });

  it('sugere medidas de controle e prioriza os riscos críticos', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorEspiao());

    const { itens } = gerador.compilar(
      empresaA,
      [risco({ tipo: 'QUIMICO', severidade: 5, probabilidade: 5 })],
      AGORA,
    );

    expect(itens[0]?.medidasControle[0]).toContain('Interromper a atividade');
    expect(itens[0]?.medidasControle.length).toBeGreaterThan(1);
  });

  it('consolida o resumo por classificação e por tipo', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorEspiao());

    const { resumo } = gerador.compilar(
      empresaA,
      [
        risco({ id: '1', tipo: 'FISICO', severidade: 5, probabilidade: 5 }),
        risco({ id: '2', tipo: 'FISICO', severidade: 1, probabilidade: 1 }),
        risco({ id: '3', tipo: 'ERGONOMICO', severidade: 3, probabilidade: 3 }),
      ],
      AGORA,
    );

    expect(resumo.totalRiscos).toBe(3);
    expect(resumo.maiorNivel).toBe(25);
    expect(resumo.porClassificacao).toEqual({ BAIXO: 1, MODERADO: 1, ALTO: 0, CRITICO: 1 });
    expect(resumo.porTipo.FISICO).toBe(2);
    expect(resumo.porTipo.QUIMICO).toBe(0);
  });

  it('aceita empresa sem riscos cadastrados', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorEspiao());

    const relatorio = gerador.compilar(empresaA, [], AGORA);

    expect(relatorio.itens).toHaveLength(0);
    expect(relatorio.resumo.maiorNivel).toBe(0);
  });
});

describe('GeradorRelatorioPGR — DIP na exportação', () => {
  it('delega ao exportador injetado, sem conhecer o formato', () => {
    const espiao = new ExportadorEspiao();

    const documento = new GeradorRelatorioPGR(espiao).gerar(empresaA, [risco()], AGORA);

    expect(documento).toEqual({ conteudo: 'ok', mimeType: 'text/plain', extensao: 'txt' });
    expect(espiao.recebido?.empresa.cnpj).toBe(empresaA.cnpj);
    expect(espiao.recebido?.geradoEm).toEqual(AGORA);
  });

  it('troca de formato altera apenas a saída, não o conteúdo compilado', () => {
    const html = new GeradorRelatorioPGR(new ExportadorHTMLRelatorio()).gerar(
      empresaA,
      [risco()],
      AGORA,
    );
    const json = new GeradorRelatorioPGR(new ExportadorJSONRelatorio()).gerar(
      empresaA,
      [risco()],
      AGORA,
    );

    expect(html.mimeType).toContain('text/html');
    expect(json.mimeType).toContain('application/json');
    expect(JSON.parse(json.conteudo)).toMatchObject({ resumo: { totalRiscos: 1 } });
  });
});

describe('ExportadorHTMLRelatorio', () => {
  it('escapa a descrição do risco para não injetar HTML', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorHTMLRelatorio());

    const { conteudo } = gerador.gerar(
      empresaA,
      [risco({ descricao: '<script>alert(1)</script>' })],
      AGORA,
    );

    expect(conteudo).not.toContain('<script>alert(1)</script>');
    expect(conteudo).toContain('&lt;script&gt;');
  });

  it('formata o CNPJ e informa a data de geração', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorHTMLRelatorio());

    const { conteudo } = gerador.gerar(empresaA, [risco()], AGORA);

    expect(conteudo).toContain('11.222.333/0001-81');
    expect(conteudo).toContain('10/03/2026');
  });

  it('informa quando não há riscos cadastrados', () => {
    const gerador = new GeradorRelatorioPGR(new ExportadorHTMLRelatorio());

    const { conteudo } = gerador.gerar(empresaA, [], AGORA);

    expect(conteudo).toContain('Nenhum risco cadastrado');
  });
});

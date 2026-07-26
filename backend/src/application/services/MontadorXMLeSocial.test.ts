import { AppError } from '../../domain/errors/AppError.js';
import { ValidadorSchemaS12 } from '../../infrastructure/esocial/ValidadorSchemaS12.js';
import type { IValidadorSchema } from '../ports/IValidadorSchema.js';
import { MontadorXMLeSocial } from './MontadorXMLeSocial.js';
import { acidenteA, asoA, colaboradorA, empresaA, riscoA } from './__fixtures__/esocial.js';

const montador = new MontadorXMLeSocial(new ValidadorSchemaS12());

describe('MontadorXMLeSocial — H3.1 (geração a partir do domínio)', () => {
  it('monta o S-2220 com os dados do ASO e do colaborador', () => {
    const { tipoEvento, xml } = montador.montarDeAso({
      empresa: empresaA,
      colaborador: colaboradorA,
      aso: asoA,
      ambiente: 'PRODUCAO_RESTRITA',
    });

    expect(tipoEvento).toBe('S_2220');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<nrInsc>11222333000181</nrInsc>');
    expect(xml).toContain('<dtAso>2026-02-01</dtAso>');
    expect(xml).toContain('<nmMed>Dr. João Souza</nmMed>');
    // PERIODICO → código 1 da tabela de tipo de exame.
    expect(xml).toContain('<tpExameOcup>1</tpExameOcup>');
  });

  it('monta o S-2240 com o agente nocivo derivado do risco', () => {
    const { tipoEvento, xml } = montador.montarDeRisco({
      empresa: empresaA,
      colaborador: colaboradorA,
      risco: riscoA,
      ambiente: 'PRODUCAO_RESTRITA',
    });

    expect(tipoEvento).toBe('S_2240');
    expect(xml).toContain('<codAgNoc>01.01.001</codAgNoc>');
    expect(xml).toContain('Ruído contínuo acima de 85 dB(A)');
    expect(xml).toContain('evtExpRisco');
  });

  it('monta o S-2210 (CAT) com os dados do acidente', () => {
    const { tipoEvento, xml } = montador.montarDeAcidente({
      empresa: empresaA,
      colaborador: colaboradorA,
      acidente: acidenteA,
      ambiente: 'PRODUCAO_RESTRITA',
    });

    expect(tipoEvento).toBe('S_2210');
    expect(xml).toContain('evtCAT');
    expect(xml).toContain('<dtAcid>2026-03-02</dtAcid>');
    expect(xml).toContain('<hrAcid>1430</hrAcid>');
    // TIPICO → código 1; CAT inicial → tpCat 1.
    expect(xml).toContain('<tpAcid>1</tpAcid>');
    expect(xml).toContain('<tpCat>1</tpCat>');
    expect(xml).toContain('<codCID>S61.0</codCID>');
    expect(xml).toContain('<nrOC>CRM-PE 54321</nrOC>');
  });

  it('omite dtObito quando não houve óbito e o inclui quando houve', () => {
    const semObito = montador.montarDeAcidente({
      empresa: empresaA,
      colaborador: colaboradorA,
      acidente: acidenteA,
      ambiente: 'PRODUCAO_RESTRITA',
    }).xml;

    const comObito = montador.montarDeAcidente({
      empresa: empresaA,
      colaborador: colaboradorA,
      acidente: {
        ...acidenteA,
        obito: true,
        dataObito: new Date('2026-03-03T00:00:00.000Z'),
        tipoCat: 'COMUNICACAO_OBITO',
      },
      ambiente: 'PRODUCAO_RESTRITA',
    }).xml;

    expect(semObito).toContain('<indCatObito>N</indCatObito>');
    expect(semObito).not.toContain('<dtObito>');
    expect(comObito).toContain('<indCatObito>S</indCatObito>');
    expect(comObito).toContain('<dtObito>2026-03-03</dtObito>');
    expect(comObito).toContain('<tpCat>3</tpCat>');
  });

  it('omite codCID quando o acidente não tem CID informado', () => {
    const { xml } = montador.montarDeAcidente({
      empresa: empresaA,
      colaborador: colaboradorA,
      acidente: { ...acidenteA, cid: null },
      ambiente: 'PRODUCAO_RESTRITA',
    });

    expect(xml).not.toContain('<codCID>');
    // O restante do atestado continua presente e válido.
    expect(xml).toContain('<dscLesao>301000</dscLesao>');
  });

  it('escapa caracteres especiais na descrição do acidente', () => {
    const { xml } = montador.montarDeAcidente({
      empresa: empresaA,
      colaborador: colaboradorA,
      acidente: { ...acidenteA, descricao: 'Prensa <sem> proteção & sem bloqueio' },
      ambiente: 'PRODUCAO_RESTRITA',
    });

    expect(xml).toContain('Prensa &lt;sem&gt; proteção &amp; sem bloqueio');
  });

  it('reflete o ambiente no campo tpAmb (H3.5)', () => {
    const restrita = montador.montarDeAso({
      empresa: empresaA,
      colaborador: colaboradorA,
      aso: asoA,
      ambiente: 'PRODUCAO_RESTRITA',
    });
    const producao = montador.montarDeAso({
      empresa: empresaA,
      colaborador: colaboradorA,
      aso: asoA,
      ambiente: 'PRODUCAO',
    });

    expect(restrita.xml).toContain('<tpAmb>2</tpAmb>');
    expect(producao.xml).toContain('<tpAmb>1</tpAmb>');
  });

  it('escapa caracteres especiais para não quebrar o XML', () => {
    const { xml } = montador.montarDeRisco({
      empresa: empresaA,
      colaborador: colaboradorA,
      risco: { ...riscoA, descricao: 'Exposição a solvente <benzeno> & derivados' },
      ambiente: 'PRODUCAO_RESTRITA',
    });

    expect(xml).toContain('&lt;benzeno&gt; &amp; derivados');
    expect(xml).not.toContain('<benzeno>');
  });
});

describe('MontadorXMLeSocial — H3.2 (bloqueio antes do envio)', () => {
  it('bloqueia a montagem quando o validador reprova, indicando o problema', () => {
    const validadorReprovador: IValidadorSchema = {
      validar: () => ({ valido: false, erros: ['eSocial/evtMonit/exMedOcup: dtAso ausente.'] }),
    };
    const montadorEstrito = new MontadorXMLeSocial(validadorReprovador);

    expect(() =>
      montadorEstrito.montarDeAso({
        empresa: empresaA,
        colaborador: colaboradorA,
        aso: asoA,
        ambiente: 'PRODUCAO_RESTRITA',
      }),
    ).toThrow(/dtAso ausente/);
  });

  it('rejeita com status 400 quando o XML não segue o leiaute', () => {
    const validadorReprovador: IValidadorSchema = {
      validar: () => ({ valido: false, erros: ['erro qualquer'] }),
    };
    const montadorEstrito = new MontadorXMLeSocial(validadorReprovador);

    try {
      montadorEstrito.montarDeRisco({
        empresa: empresaA,
        colaborador: colaboradorA,
        risco: riscoA,
        ambiente: 'PRODUCAO_RESTRITA',
      });
      throw new Error('deveria ter lançado');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(400);
    }
  });
});

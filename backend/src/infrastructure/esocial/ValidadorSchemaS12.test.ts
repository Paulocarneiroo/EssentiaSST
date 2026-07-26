import { MontadorXMLeSocial } from '../../application/services/MontadorXMLeSocial.js';
import {
  asoA,
  colaboradorA,
  empresaA,
  riscoA,
} from '../../application/services/__fixtures__/esocial.js';
import { ValidadorSchemaS12 } from './ValidadorSchemaS12.js';

const validador = new ValidadorSchemaS12();
const montador = new MontadorXMLeSocial(validador);

const xmlS2220 = montador.montarDeAso({
  empresa: empresaA,
  colaborador: colaboradorA,
  aso: asoA,
  ambiente: 'PRODUCAO_RESTRITA',
}).xml;

const xmlS2240 = montador.montarDeRisco({
  empresa: empresaA,
  colaborador: colaboradorA,
  risco: riscoA,
  ambiente: 'PRODUCAO_RESTRITA',
}).xml;

describe('ValidadorSchemaS12 — aceita o que o montador produz', () => {
  it('valida o S-2220 gerado', () => {
    expect(validador.validar(xmlS2220)).toEqual({ valido: true, erros: [] });
  });

  it('valida o S-2240 gerado', () => {
    expect(validador.validar(xmlS2240)).toEqual({ valido: true, erros: [] });
  });
});

describe('ValidadorSchemaS12 — H3.2 (bloqueia XML fora do schema)', () => {
  it('acusa elemento obrigatório ausente indicando o caminho', () => {
    const semDtAso = xmlS2220.replace(/\s*<dtAso>.*<\/dtAso>/, '');
    const resultado = validador.validar(semDtAso);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toContain('<dtAso> ausente');
  });

  it('acusa valor fora do domínio permitido', () => {
    const resultadoInvalido = xmlS2220.replace('<resAso>1</resAso>', '<resAso>7</resAso>');
    const resultado = validador.validar(resultadoInvalido);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toContain('resAso');
  });

  it('acusa CPF fora do formato', () => {
    const cpfCurto = xmlS2220.replace('<cpfTrab>12345678909<', '<cpfTrab>123<');
    const resultado = validador.validar(cpfCurto);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toContain('cpfTrab');
  });

  it('acusa elementos fora de ordem', () => {
    // Inverte indRetif e tpAmb dentro de ideEvento.
    const foraDeOrdem = xmlS2220.replace(
      '<indRetif>1</indRetif>\n      <tpAmb>2</tpAmb>',
      '<tpAmb>2</tpAmb>\n      <indRetif>1</indRetif>',
    );
    expect(foraDeOrdem).not.toBe(xmlS2220);

    const resultado = validador.validar(foraDeOrdem);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toContain('indRetif');
  });

  it('rejeita XML malformado', () => {
    const resultado = validador.validar('<eSocial><evtMonit></eSocial>');

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toContain('malformado');
  });

  it('rejeita evento desconhecido', () => {
    const resultado = validador.validar('<eSocial><evtDesconhecido/></eSocial>');

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toContain('não reconhecido');
  });

  it('rejeita namespace de outra versão do leiaute', () => {
    const versaoAntiga = xmlS2220.replace('v_S_01_02_00', 'v_S_01_00_00');
    const resultado = validador.validar(versaoAntiga);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toContain('xmlns');
  });
});

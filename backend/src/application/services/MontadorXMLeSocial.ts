import type { Aso, ResultadoAso, TipoExame } from '../../domain/entities/Aso.js';
import type { Colaborador } from '../../domain/entities/Colaborador.js';
import type { Empresa } from '../../domain/entities/Empresa.js';
import type { Risco, TipoRisco } from '../../domain/entities/Risco.js';
import {
  codigoAmbiente,
  type AmbienteESocial,
  type TipoEventoESocial,
} from '../../domain/entities/EventoESocial.js';
import { ValidationError } from '../../domain/errors/AppError.js';
import type { IValidadorSchema } from '../ports/IValidadorSchema.js';

/** Versão do leiaute implementado. */
export const VERSAO_LEIAUTE = 'S_01_02_00';

/** Identificação do processo emissor no campo `verProc`. */
const VERSAO_PROCESSO = 'EssentiaSST-0.1.0';

export interface ContextoAso {
  empresa: Empresa;
  colaborador: Colaborador;
  aso: Aso;
  ambiente: AmbienteESocial;
}

export interface ContextoRisco {
  empresa: Empresa;
  colaborador: Colaborador;
  risco: Risco;
  ambiente: AmbienteESocial;
}

export interface EventoMontado {
  tipoEvento: TipoEventoESocial;
  xml: string;
}

/** Tabela 15 do eSocial — tipo de exame ocupacional. */
const COD_TIPO_EXAME: Record<TipoExame, string> = {
  ADMISSIONAL: '0',
  PERIODICO: '1',
  RETORNO_TRABALHO: '2',
  MUDANCA_RISCO: '3',
  DEMISSIONAL: '9',
};

/** Resultado do ASO conforme o campo `resAso`. */
const COD_RESULTADO_ASO: Record<ResultadoAso, string> = {
  APTO: '1',
  INAPTO: '2',
  APTO_COM_RESTRICOES: '1',
};

/**
 * Códigos da Tabela 24 (agentes nocivos) por categoria de risco do PGR.
 *
 * ATENÇÃO: mapeamento representativo, suficiente para montar um evento
 * estruturalmente válido. Antes de qualquer uso em produção, deve ser
 * substituído pelo código específico do agente identificado no PGR — a
 * Tabela 24 discrimina o agente (ruído, sílica, benzeno…), não a categoria.
 */
const COD_AGENTE_NOCIVO: Record<TipoRisco, string> = {
  FISICO: '01.01.001',
  QUIMICO: '02.01.001',
  BIOLOGICO: '03.01.001',
  // Riscos ergonômicos e de acidente não constam da Tabela 24 (que trata de
  // agentes para aposentadoria especial): declarados como ausência de agente.
  ERGONOMICO: '09.01.001',
  ACIDENTE: '09.01.001',
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Identificador do evento conforme o leiaute: "ID" + tpInsc (1) + CNPJ (14)
 * + timestamp (14) + sequencial (5) — 36 caracteres.
 */
const gerarId = (cnpj: string, sequencial: number, agora: Date): string => {
  const timestamp = agora
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);
  return `ID1${cnpj.padStart(14, '0')}${timestamp}${String(sequencial).padStart(5, '0')}`;
};

const ideEvento = (ambiente: AmbienteESocial): string => `
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>${codigoAmbiente(ambiente)}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>${escapeXml(VERSAO_PROCESSO)}</verProc>
    </ideEvento>`;

const ideEmpregador = (empresa: Empresa): string => `
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${escapeXml(empresa.cnpj)}</nrInsc>
    </ideEmpregador>`;

/**
 * O campo `matricula` do leiaute admite no máximo 30 caracteres, enquanto o id
 * interno é um UUID de 36. Enquanto `Colaborador` não tiver uma matrícula
 * própria — que é o dado correto a enviar —, deriva-se um identificador estável
 * a partir do UUID sem hifens.
 */
const matriculaDe = (colaborador: Colaborador): string =>
  colaborador.id.replace(/-/g, '').slice(0, 30);

const ideVinculo = (colaborador: Colaborador): string => `
    <ideVinculo>
      <cpfTrab>${escapeXml(colaborador.cpf)}</cpfTrab>
      <matricula>${escapeXml(matriculaDe(colaborador))}</matricula>
    </ideVinculo>`;

/**
 * `MontadorXMLeSocial` — constrói o payload conforme o leiaute S-1.2.
 *
 * SRP: sua única razão de mudar é a alteração do leiaute XML.
 * DIP: recebe `IValidadorSchema` por injeção, sem conhecer a biblioteca de validação.
 */
export class MontadorXMLeSocial {
  constructor(private readonly validador: IValidadorSchema) {}

  /** Evento S-2220 — Monitoramento da Saúde do Trabalhador, a partir de um ASO. */
  montarDeAso(ctx: ContextoAso, sequencial = 1, agora = new Date()): EventoMontado {
    const { empresa, colaborador, aso, ambiente } = ctx;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtMonit/v_${VERSAO_LEIAUTE}">
  <evtMonit Id="${gerarId(empresa.cnpj, sequencial, agora)}">${ideEvento(ambiente)}${ideEmpregador(empresa)}${ideVinculo(colaborador)}
    <exMedOcup>
      <tpExameOcup>${COD_TIPO_EXAME[aso.tipoExame]}</tpExameOcup>
      <aso>
        <dtAso>${formatDate(aso.dataExame)}</dtAso>
        <resAso>${COD_RESULTADO_ASO[aso.resultado]}</resAso>
        <medico>
          <nmMed>${escapeXml(aso.medico)}</nmMed>
          <nrCRM>${escapeXml(aso.crm)}</nrCRM>
        </medico>
      </aso>
    </exMedOcup>
  </evtMonit>
</eSocial>`;

    return this.validarEMontar('S_2220', xml);
  }

  /** Evento S-2240 — Condições Ambientais do Trabalho, a partir de um Risco. */
  montarDeRisco(ctx: ContextoRisco, sequencial = 1, agora = new Date()): EventoMontado {
    const { empresa, colaborador, risco, ambiente } = ctx;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtExpRisco/v_${VERSAO_LEIAUTE}">
  <evtExpRisco Id="${gerarId(empresa.cnpj, sequencial, agora)}">${ideEvento(ambiente)}${ideEmpregador(empresa)}${ideVinculo(colaborador)}
    <infoExpRisco>
      <dtIniCondicao>${formatDate(colaborador.dataAdmissao)}</dtIniCondicao>
      <infoAmb>
        <localAmb>1</localAmb>
        <dscSetor>${escapeXml(colaborador.cargo)}</dscSetor>
        <tpInsc>1</tpInsc>
        <nrInsc>${escapeXml(empresa.cnpj)}</nrInsc>
      </infoAmb>
      <agNoc>
        <codAgNoc>${COD_AGENTE_NOCIVO[risco.tipo]}</codAgNoc>
        <dscAgNoc>${escapeXml(risco.descricao)}</dscAgNoc>
        <tpAval>1</tpAval>
      </agNoc>
    </infoExpRisco>
  </evtExpRisco>
</eSocial>`;

    return this.validarEMontar('S_2240', xml);
  }

  /** H3.2: XML fora do schema é bloqueado, com indicação do problema. */
  private validarEMontar(tipoEvento: TipoEventoESocial, xml: string): EventoMontado {
    const resultado = this.validador.validar(xml);
    if (!resultado.valido) {
      throw new ValidationError(
        `XML do evento ${tipoEvento.replace('_', '-')} não está conforme o leiaute S-1.2: ${resultado.erros.join(' | ')}`,
      );
    }
    return { tipoEvento, xml };
  }
}

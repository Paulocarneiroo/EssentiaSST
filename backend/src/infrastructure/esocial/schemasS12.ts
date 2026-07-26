import { VERSAO_LEIAUTE } from '../../application/services/MontadorXMLeSocial.js';

/** Regra de um elemento do leiaute: filhos esperados ou restrição sobre o valor. */
export interface ElementSpec {
  name: string;
  /** Filhos esperados, na ordem do leiaute. */
  children?: ElementSpec[];
  /** Elemento pode ser omitido. */
  opcional?: boolean;
  /** Elemento pode repetir (1..N). */
  repetivel?: boolean;
  /** Atributos obrigatórios e seus formatos. */
  atributos?: { nome: string; padrao: RegExp }[];
  /** Formato do conteúdo textual (elementos folha). */
  padrao?: RegExp;
  /** Valores admitidos para o conteúdo textual. */
  valores?: string[];
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const CPF = /^\d{11}$/;
const CNPJ = /^\d{14}$/;
/** "ID" + tpInsc (1) + CNPJ (14) + timestamp (14) + sequencial (5). */
const ID_EVENTO = /^ID\d{34}$/;
const COD_AGENTE = /^\d{2}\.\d{2}\.\d{3}$/;
/** Hora no formato HHMM (`hrAcid`, `hrAtendimento`). */
const HORA = /^([01]\d|2[0-3])[0-5]\d$/;
/** Códigos das tabelas 11 a 14 do eSocial: seis dígitos. */
const COD_TABELA = /^\d{6}$/;
const SIM_NAO = ['S', 'N'];

const ideEvento: ElementSpec = {
  name: 'ideEvento',
  children: [
    { name: 'indRetif', valores: ['1', '2'] },
    { name: 'tpAmb', valores: ['1', '2'] },
    { name: 'procEmi', valores: ['1', '2', '3', '4'] },
    { name: 'verProc', padrao: /^.{1,20}$/ },
  ],
};

const ideEmpregador: ElementSpec = {
  name: 'ideEmpregador',
  children: [
    { name: 'tpInsc', valores: ['1', '2', '3', '4'] },
    { name: 'nrInsc', padrao: CNPJ },
  ],
};

const ideVinculo: ElementSpec = {
  name: 'ideVinculo',
  children: [
    { name: 'cpfTrab', padrao: CPF },
    { name: 'matricula', padrao: /^.{1,30}$/ },
  ],
};

/** S-2220 — Monitoramento da Saúde do Trabalhador. */
export const SCHEMA_S2220: ElementSpec = {
  name: 'eSocial',
  atributos: [
    {
      nome: 'xmlns',
      padrao: new RegExp(
        `^http://www\\.esocial\\.gov\\.br/schema/evt/evtMonit/v_${VERSAO_LEIAUTE}$`,
      ),
    },
  ],
  children: [
    {
      name: 'evtMonit',
      atributos: [{ nome: 'Id', padrao: ID_EVENTO }],
      children: [
        ideEvento,
        ideEmpregador,
        ideVinculo,
        {
          name: 'exMedOcup',
          children: [
            { name: 'tpExameOcup', valores: ['0', '1', '2', '3', '4', '9'] },
            {
              name: 'aso',
              children: [
                { name: 'dtAso', padrao: DATA },
                { name: 'resAso', valores: ['1', '2'] },
                {
                  name: 'medico',
                  children: [
                    { name: 'nmMed', padrao: /^.{2,70}$/ },
                    { name: 'nrCRM', padrao: /^.{1,20}$/ },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** S-2240 — Condições Ambientais do Trabalho / Agentes Nocivos. */
export const SCHEMA_S2240: ElementSpec = {
  name: 'eSocial',
  atributos: [
    {
      nome: 'xmlns',
      padrao: new RegExp(
        `^http://www\\.esocial\\.gov\\.br/schema/evt/evtExpRisco/v_${VERSAO_LEIAUTE}$`,
      ),
    },
  ],
  children: [
    {
      name: 'evtExpRisco',
      atributos: [{ nome: 'Id', padrao: ID_EVENTO }],
      children: [
        ideEvento,
        ideEmpregador,
        ideVinculo,
        {
          name: 'infoExpRisco',
          children: [
            { name: 'dtIniCondicao', padrao: DATA },
            {
              name: 'infoAmb',
              children: [
                { name: 'localAmb', valores: ['1', '2'] },
                { name: 'dscSetor', padrao: /^.{1,100}$/ },
                { name: 'tpInsc', valores: ['1', '2', '3', '4'] },
                { name: 'nrInsc', padrao: CNPJ },
              ],
            },
            {
              name: 'agNoc',
              repetivel: true,
              children: [
                { name: 'codAgNoc', padrao: COD_AGENTE },
                { name: 'dscAgNoc', padrao: /^.{1,500}$/, opcional: true },
                { name: 'tpAval', valores: ['1', '2'] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** S-2210 — Comunicação de Acidente de Trabalho (CAT). */
export const SCHEMA_S2210: ElementSpec = {
  name: 'eSocial',
  atributos: [
    {
      nome: 'xmlns',
      padrao: new RegExp(`^http://www\\.esocial\\.gov\\.br/schema/evt/evtCAT/v_${VERSAO_LEIAUTE}$`),
    },
  ],
  children: [
    {
      name: 'evtCAT',
      atributos: [{ nome: 'Id', padrao: ID_EVENTO }],
      children: [
        ideEvento,
        ideEmpregador,
        ideVinculo,
        {
          name: 'cat',
          children: [
            { name: 'dtAcid', padrao: DATA },
            { name: 'tpAcid', valores: ['1', '2', '3'] },
            { name: 'hrAcid', padrao: HORA },
            { name: 'hrsTrabAntesAcid', padrao: HORA },
            { name: 'tpCat', valores: ['1', '2', '3'] },
            { name: 'indCatObito', valores: SIM_NAO },
            { name: 'dtObito', padrao: DATA, opcional: true },
            { name: 'indComunPolicia', valores: SIM_NAO },
            { name: 'codSitGeradora', padrao: COD_TABELA },
            { name: 'iniciatCAT', valores: ['1', '2', '3'] },
            { name: 'obsCAT', padrao: /^[\s\S]{1,999}$/, opcional: true },
            {
              name: 'localAcidente',
              children: [
                { name: 'tpLocal', valores: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
                { name: 'dscLocal', padrao: /^.{1,255}$/ },
                { name: 'tpInsc', valores: ['1', '2', '3', '4'] },
                { name: 'nrInsc', padrao: CNPJ },
              ],
            },
            {
              name: 'parteAtingida',
              children: [
                { name: 'codParteAting', padrao: COD_TABELA },
                { name: 'lateralidade', valores: ['0', '1', '2', '3'] },
              ],
            },
            {
              name: 'agenteCausador',
              children: [{ name: 'codAgntCausador', padrao: COD_TABELA }],
            },
            {
              name: 'atestado',
              children: [
                { name: 'dtAtendimento', padrao: DATA },
                { name: 'hrAtendimento', padrao: HORA },
                { name: 'indInternacao', valores: SIM_NAO },
                { name: 'durTrat', padrao: /^\d{1,4}$/ },
                { name: 'indAfast', valores: SIM_NAO },
                { name: 'dscLesao', padrao: COD_TABELA },
                { name: 'codCID', padrao: /^[A-Z]\d{2}(\.\d)?$/, opcional: true },
                {
                  name: 'emitente',
                  children: [
                    { name: 'nmEmit', padrao: /^.{2,70}$/ },
                    { name: 'ideOC', valores: ['1', '2', '3', '4', '5'] },
                    { name: 'nrOC', padrao: /^.{1,14}$/ },
                    { name: 'ufOC', padrao: /^[A-Z]{2}$/ },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Seleciona o schema pelo elemento de evento presente no documento. */
export const SCHEMAS_POR_EVENTO: Record<string, ElementSpec> = {
  evtCAT: SCHEMA_S2210,
  evtMonit: SCHEMA_S2220,
  evtExpRisco: SCHEMA_S2240,
};

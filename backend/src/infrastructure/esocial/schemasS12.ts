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

/** Seleciona o schema pelo elemento de evento presente no documento. */
export const SCHEMAS_POR_EVENTO: Record<string, ElementSpec> = {
  evtMonit: SCHEMA_S2220,
  evtExpRisco: SCHEMA_S2240,
};

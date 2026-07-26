/** Natureza do acidente (`tpAcid` do leiaute S-2210). */
export type TipoAcidente = 'TIPICO' | 'DOENCA' | 'TRAJETO';

/** Momento da comunicação (`tpCat`). */
export type TipoCat = 'INICIAL' | 'REABERTURA' | 'COMUNICACAO_OBITO';

export type ParteAtingida =
  | 'CABECA'
  | 'OLHOS'
  | 'MAO'
  | 'BRACO'
  | 'TRONCO'
  | 'PERNA'
  | 'PE'
  | 'MULTIPLAS';

export type AgenteCausador =
  | 'MAQUINA'
  | 'FERRAMENTA'
  | 'QUEDA'
  | 'VEICULO'
  | 'SUBSTANCIA_QUIMICA'
  | 'ELETRICIDADE'
  | 'OUTRO';

export type TipoLesao =
  | 'CORTE'
  | 'FRATURA'
  | 'QUEIMADURA'
  | 'CONTUSAO'
  | 'ENTORSE'
  | 'INTOXICACAO'
  | 'OUTRA';

export const TIPOS_ACIDENTE: readonly TipoAcidente[] = ['TIPICO', 'DOENCA', 'TRAJETO'];

export const TIPOS_CAT: readonly TipoCat[] = ['INICIAL', 'REABERTURA', 'COMUNICACAO_OBITO'];

export const PARTES_ATINGIDAS: readonly ParteAtingida[] = [
  'CABECA',
  'OLHOS',
  'MAO',
  'BRACO',
  'TRONCO',
  'PERNA',
  'PE',
  'MULTIPLAS',
];

export const AGENTES_CAUSADORES: readonly AgenteCausador[] = [
  'MAQUINA',
  'FERRAMENTA',
  'QUEDA',
  'VEICULO',
  'SUBSTANCIA_QUIMICA',
  'ELETRICIDADE',
  'OUTRO',
];

export const TIPOS_LESAO: readonly TipoLesao[] = [
  'CORTE',
  'FRATURA',
  'QUEIMADURA',
  'CONTUSAO',
  'ENTORSE',
  'INTOXICACAO',
  'OUTRA',
];

/**
 * Acidente de trabalho — existe apenas no contexto de um colaborador (composição)
 * e é o fato de origem do evento S-2210 (CAT).
 */
export interface Acidente {
  id: string;
  colaboradorId: string;
  dataAcidente: Date;
  /** Formato HHMM, como exige o leiaute. */
  horaAcidente: string;
  /** Horas trabalhadas antes do acidente, formato HHMM. */
  horasTrabalhadasAntes: string;
  tipoAcidente: TipoAcidente;
  tipoCat: TipoCat;
  obito: boolean;
  dataObito: Date | null;
  comunicadoPolicia: boolean;
  localAcidente: string;
  parteAtingida: ParteAtingida;
  agenteCausador: AgenteCausador;
  tipoLesao: TipoLesao;
  descricao: string;
  cid: string | null;
  dataAtendimento: Date;
  horaAtendimento: string;
  houveInternacao: boolean;
  houveAfastamento: boolean;
  duracaoTratamentoDias: number;
  medico: string;
  crm: string;
  ufCrm: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAcidenteData {
  colaboradorId: string;
  dataAcidente: string;
  horaAcidente: string;
  horasTrabalhadasAntes: string;
  tipoAcidente: TipoAcidente;
  tipoCat?: TipoCat;
  obito?: boolean;
  dataObito?: string | null;
  comunicadoPolicia?: boolean;
  localAcidente: string;
  parteAtingida: ParteAtingida;
  agenteCausador: AgenteCausador;
  tipoLesao: TipoLesao;
  descricao: string;
  cid?: string | null;
  dataAtendimento: string;
  horaAtendimento: string;
  houveInternacao?: boolean;
  houveAfastamento?: boolean;
  duracaoTratamentoDias?: number;
  medico: string;
  crm: string;
  ufCrm: string;
}

export type UpdateAcidenteData = Partial<Omit<CreateAcidenteData, 'colaboradorId'>>;

/**
 * Prazo legal de comunicação da CAT: até o primeiro dia útil seguinte ao acidente,
 * e imediatamente em caso de óbito (Lei 8.213/91, art. 22).
 */
export const prazoComunicacaoExpirado = (acidente: Acidente, agora = new Date()): boolean => {
  if (acidente.obito) {
    return agora.getTime() > acidente.dataAcidente.getTime();
  }
  const limite = new Date(acidente.dataAcidente.getTime());
  limite.setUTCDate(limite.getUTCDate() + 1);
  limite.setUTCHours(23, 59, 59, 999);
  return agora.getTime() > limite.getTime();
};

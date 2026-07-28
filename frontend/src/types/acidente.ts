export type TipoAcidente = 'TIPICO' | 'DOENCA' | 'TRAJETO';

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

/** Acidente de trabalho — fato de origem do evento S-2210 (CAT). */
export interface Acidente {
  id: string;
  colaboradorId: string;
  dataAcidente: string;
  horaAcidente: string;
  horasTrabalhadasAntes: string;
  tipoAcidente: TipoAcidente;
  tipoCat: TipoCat;
  obito: boolean;
  dataObito: string | null;
  comunicadoPolicia: boolean;
  localAcidente: string;
  parteAtingida: ParteAtingida;
  agenteCausador: AgenteCausador;
  tipoLesao: TipoLesao;
  descricao: string;
  cid: string | null;
  dataAtendimento: string;
  horaAtendimento: string;
  houveInternacao: boolean;
  houveAfastamento: boolean;
  duracaoTratamentoDias: number;
  medico: string;
  crm: string;
  ufCrm: string;
  createdAt: string;
  updatedAt: string;
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

export type TipoExame =
  | 'ADMISSIONAL'
  | 'PERIODICO'
  | 'RETORNO_TRABALHO'
  | 'MUDANCA_RISCO'
  | 'DEMISSIONAL';

export type ResultadoAso = 'APTO' | 'INAPTO' | 'APTO_COM_RESTRICOES';

export const TIPOS_EXAME: readonly TipoExame[] = [
  'ADMISSIONAL',
  'PERIODICO',
  'RETORNO_TRABALHO',
  'MUDANCA_RISCO',
  'DEMISSIONAL',
];

export const RESULTADOS_ASO: readonly ResultadoAso[] = ['APTO', 'INAPTO', 'APTO_COM_RESTRICOES'];

/** Atestado de Saúde Ocupacional — existe apenas no contexto de um colaborador. */
export interface Aso {
  id: string;
  colaboradorId: string;
  tipoExame: TipoExame;
  dataExame: Date;
  resultado: ResultadoAso;
  medico: string;
  crm: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAsoData {
  colaboradorId: string;
  tipoExame: TipoExame;
  dataExame: string;
  resultado: ResultadoAso;
  medico: string;
  crm: string;
}

export type UpdateAsoData = Partial<Omit<CreateAsoData, 'colaboradorId'>>;

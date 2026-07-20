export type TipoRisco = 'FISICO' | 'QUIMICO' | 'BIOLOGICO' | 'ERGONOMICO' | 'ACIDENTE';

export const TIPOS_RISCO: readonly TipoRisco[] = [
  'FISICO',
  'QUIMICO',
  'BIOLOGICO',
  'ERGONOMICO',
  'ACIDENTE',
];

/** Risco ocupacional catalogado no PGR da empresa. */
export interface Risco {
  id: string;
  empresaId: string;
  descricao: string;
  tipo: TipoRisco;
  severidade: number;
  probabilidade: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRiscoData {
  empresaId: string;
  descricao: string;
  tipo: TipoRisco;
  severidade: number;
  probabilidade: number;
}

export type UpdateRiscoData = Partial<Omit<CreateRiscoData, 'empresaId'>>;

/**
 * Nível de risco = severidade × probabilidade (matriz 5×5 do PGR).
 * Mantido como função pura de domínio, sem acoplamento a persistência.
 */
export const calcularNivelRisco = (risco: Pick<Risco, 'severidade' | 'probabilidade'>): number =>
  risco.severidade * risco.probabilidade;

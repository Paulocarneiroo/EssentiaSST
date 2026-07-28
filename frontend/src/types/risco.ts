export type TipoRisco = 'FISICO' | 'QUIMICO' | 'BIOLOGICO' | 'ERGONOMICO' | 'ACIDENTE';

export type ClassificacaoRisco = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';

export const TIPOS_RISCO: readonly TipoRisco[] = [
  'FISICO',
  'QUIMICO',
  'BIOLOGICO',
  'ERGONOMICO',
  'ACIDENTE',
];

export interface Risco {
  id: string;
  empresaId: string;
  descricao: string;
  tipo: TipoRisco;
  severidade: number;
  probabilidade: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRiscoData {
  empresaId: string;
  descricao: string;
  tipo: TipoRisco;
  severidade: number;
  probabilidade: number;
}

export type UpdateRiscoData = Partial<Omit<CreateRiscoData, 'empresaId'>>;

/** Espelha a matriz 5×5 do backend (`domain/entities/Risco.ts`) para exibir nível e cor sem ida ao servidor. */
export const calcularNivelRisco = (risco: Pick<Risco, 'severidade' | 'probabilidade'>): number =>
  risco.severidade * risco.probabilidade;

export const classificarRisco = (nivel: number): ClassificacaoRisco => {
  if (nivel <= 4) return 'BAIXO';
  if (nivel <= 9) return 'MODERADO';
  if (nivel <= 16) return 'ALTO';
  return 'CRITICO';
};

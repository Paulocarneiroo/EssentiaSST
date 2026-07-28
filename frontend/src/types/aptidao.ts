import type { Aso } from './aso.js';

export type SituacaoAptidao =
  | 'APTO'
  | 'APTO_COM_RESTRICOES'
  | 'INAPTO'
  | 'VENCIDO'
  | 'SEM_ASO'
  | 'DESLIGADO';

/** Retorno de `GET /colaboradores/:id/aptidao` — a regra da NR-07 vive no backend. */
export interface AvaliacaoAptidao {
  colaboradorId: string;
  situacao: SituacaoAptidao;
  apto: boolean;
  motivo: string;
  asoVigente: Aso | null;
  proximoVencimento: string | null;
  diasParaVencimento: number | null;
  periodicidadeMeses: number | null;
}

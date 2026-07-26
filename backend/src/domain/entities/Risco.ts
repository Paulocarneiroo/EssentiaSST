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

export type ClassificacaoRisco = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';

export const CLASSIFICACOES_RISCO: readonly ClassificacaoRisco[] = [
  'BAIXO',
  'MODERADO',
  'ALTO',
  'CRITICO',
];

/** Faixas da matriz 5×5 (nível de 1 a 25) usadas na priorização do plano de ação. */
export const classificarRisco = (nivel: number): ClassificacaoRisco => {
  if (nivel <= 4) return 'BAIXO';
  if (nivel <= 9) return 'MODERADO';
  if (nivel <= 16) return 'ALTO';
  return 'CRITICO';
};

/** Medidas típicas por natureza do agente, na ordem da hierarquia da NR-01 (item 1.4.1). */
const MEDIDAS_POR_TIPO: Record<TipoRisco, readonly string[]> = {
  FISICO: [
    'Enclausurar ou isolar a fonte geradora (ruído, calor, vibração).',
    'Reduzir o tempo de exposição por rodízio de tarefas.',
    'Fornecer e fiscalizar o uso de EPI adequado ao agente (ex.: protetor auricular).',
  ],
  QUIMICO: [
    'Substituir o agente por outro de menor toxicidade.',
    'Instalar ventilação local exaustora no ponto de emissão.',
    'Manter FISPQ acessível e treinar a equipe quanto ao manuseio.',
    'Fornecer EPI respiratório e luvas compatíveis com o agente.',
  ],
  BIOLOGICO: [
    'Adotar barreiras físicas e procedimentos de assepsia.',
    'Manter o calendário de imunização dos expostos em dia.',
    'Definir fluxo de descarte de perfurocortantes e resíduos infectantes.',
    'Fornecer EPI de barreira (luvas, avental, máscara).',
  ],
  ERGONOMICO: [
    'Adequar mobiliário e posto de trabalho à antropometria do trabalhador.',
    'Instituir pausas e alternância de posturas na jornada.',
    'Realizar Análise Ergonômica do Trabalho (NR-17) do posto.',
  ],
  ACIDENTE: [
    'Instalar proteções fixas ou intertravadas nas zonas de perigo.',
    'Aplicar bloqueio e etiquetagem (LOTO) na manutenção.',
    'Sinalizar áreas de circulação e pontos de risco.',
    'Fornecer EPI compatível com o risco residual.',
  ],
};

/**
 * Sugere medidas de controle para o risco, do mais eficaz ao menos eficaz.
 * É uma sugestão automática de partida — não substitui a avaliação do responsável técnico.
 */
export const sugerirMedidasControle = (
  risco: Pick<Risco, 'tipo' | 'severidade' | 'probabilidade'>,
): string[] => {
  const medidas = [...MEDIDAS_POR_TIPO[risco.tipo]];
  const classificacao = classificarRisco(calcularNivelRisco(risco));

  if (classificacao === 'CRITICO') {
    medidas.unshift(
      'Interromper a atividade até a implantação de medida de controle eficaz (risco crítico).',
    );
  } else if (classificacao === 'ALTO') {
    medidas.unshift('Priorizar no plano de ação, com prazo e responsável definidos (NR-01).');
  }

  return medidas;
};

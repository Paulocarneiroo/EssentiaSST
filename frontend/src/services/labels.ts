import type { ResultadoAso, TipoExame } from '../types/aso';
import type { SituacaoAptidao } from '../types/aptidao';
import type {
  AgenteCausador,
  ParteAtingida,
  TipoAcidente,
  TipoCat,
  TipoLesao,
} from '../types/acidente';
import type { AmbienteESocial, StatusEventoESocial, TipoEventoESocial } from '../types/evento';
import type { ClassificacaoRisco, TipoRisco } from '../types/risco';
import type { Papel } from '../types/usuario';

/** Cores do Bootstrap usadas nos badges. */
export type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';

export const LABEL_PAPEL: Record<Papel, string> = {
  ADMIN: 'Administrador',
  OPERADOR: 'Operador',
};

export const LABEL_TIPO_EXAME: Record<TipoExame, string> = {
  ADMISSIONAL: 'Admissional',
  PERIODICO: 'Periódico',
  RETORNO_TRABALHO: 'Retorno ao trabalho',
  MUDANCA_RISCO: 'Mudança de risco',
  DEMISSIONAL: 'Demissional',
};

export const LABEL_RESULTADO_ASO: Record<ResultadoAso, string> = {
  APTO: 'Apto',
  INAPTO: 'Inapto',
  APTO_COM_RESTRICOES: 'Apto com restrições',
};

export const VARIANT_RESULTADO_ASO: Record<ResultadoAso, Variant> = {
  APTO: 'success',
  INAPTO: 'danger',
  APTO_COM_RESTRICOES: 'warning',
};

export const LABEL_SITUACAO_APTIDAO: Record<SituacaoAptidao, string> = {
  APTO: 'Apto',
  APTO_COM_RESTRICOES: 'Apto com restrições',
  INAPTO: 'Inapto',
  VENCIDO: 'ASO vencido',
  SEM_ASO: 'Sem ASO',
  DESLIGADO: 'Desligado',
};

export const VARIANT_SITUACAO_APTIDAO: Record<SituacaoAptidao, Variant> = {
  APTO: 'success',
  APTO_COM_RESTRICOES: 'warning',
  INAPTO: 'danger',
  VENCIDO: 'danger',
  SEM_ASO: 'secondary',
  DESLIGADO: 'dark',
};

export const LABEL_TIPO_RISCO: Record<TipoRisco, string> = {
  FISICO: 'Físico',
  QUIMICO: 'Químico',
  BIOLOGICO: 'Biológico',
  ERGONOMICO: 'Ergonômico',
  ACIDENTE: 'Acidente',
};

export const LABEL_CLASSIFICACAO: Record<ClassificacaoRisco, string> = {
  BAIXO: 'Baixo',
  MODERADO: 'Moderado',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
};

export const VARIANT_CLASSIFICACAO: Record<ClassificacaoRisco, Variant> = {
  BAIXO: 'success',
  MODERADO: 'info',
  ALTO: 'warning',
  CRITICO: 'danger',
};

export const LABEL_TIPO_ACIDENTE: Record<TipoAcidente, string> = {
  TIPICO: 'Típico',
  DOENCA: 'Doença ocupacional',
  TRAJETO: 'Trajeto',
};

export const LABEL_TIPO_CAT: Record<TipoCat, string> = {
  INICIAL: 'CAT inicial',
  REABERTURA: 'Reabertura',
  COMUNICACAO_OBITO: 'Comunicação de óbito',
};

export const LABEL_PARTE_ATINGIDA: Record<ParteAtingida, string> = {
  CABECA: 'Cabeça',
  OLHOS: 'Olhos',
  MAO: 'Mão',
  BRACO: 'Braço',
  TRONCO: 'Tronco',
  PERNA: 'Perna',
  PE: 'Pé',
  MULTIPLAS: 'Múltiplas partes',
};

export const LABEL_AGENTE_CAUSADOR: Record<AgenteCausador, string> = {
  MAQUINA: 'Máquina',
  FERRAMENTA: 'Ferramenta',
  QUEDA: 'Queda',
  VEICULO: 'Veículo',
  SUBSTANCIA_QUIMICA: 'Substância química',
  ELETRICIDADE: 'Eletricidade',
  OUTRO: 'Outro',
};

export const LABEL_TIPO_LESAO: Record<TipoLesao, string> = {
  CORTE: 'Corte',
  FRATURA: 'Fratura',
  QUEIMADURA: 'Queimadura',
  CONTUSAO: 'Contusão',
  ENTORSE: 'Entorse',
  INTOXICACAO: 'Intoxicação',
  OUTRA: 'Outra',
};

export const LABEL_TIPO_EVENTO: Record<TipoEventoESocial, string> = {
  S_2210: 'S-2210 — CAT',
  S_2220: 'S-2220 — Monitoramento da saúde',
  S_2240: 'S-2240 — Condições ambientais',
};

export const SIGLA_TIPO_EVENTO: Record<TipoEventoESocial, string> = {
  S_2210: 'S-2210',
  S_2220: 'S-2220',
  S_2240: 'S-2240',
};

export const LABEL_STATUS_EVENTO: Record<StatusEventoESocial, string> = {
  PENDENTE: 'Pendente',
  ENVIADO: 'Enviado',
  ACEITO: 'Aceito',
  REJEITADO: 'Rejeitado',
};

export const VARIANT_STATUS_EVENTO: Record<StatusEventoESocial, Variant> = {
  PENDENTE: 'secondary',
  ENVIADO: 'info',
  ACEITO: 'success',
  REJEITADO: 'danger',
};

export const LABEL_AMBIENTE: Record<AmbienteESocial, string> = {
  PRODUCAO: 'Produção',
  PRODUCAO_RESTRITA: 'Produção restrita (homologação)',
};

export const VARIANT_AMBIENTE: Record<AmbienteESocial, Variant> = {
  PRODUCAO: 'danger',
  PRODUCAO_RESTRITA: 'info',
};

export const LABEL_GRAU_RISCO: Record<number, string> = {
  1: '1 — Risco mínimo',
  2: '2 — Risco baixo',
  3: '3 — Risco médio',
  4: '4 — Risco alto',
};

/** Converte um `Record<T, string>` em opções de `<select>`. */
export const opcoesDe = <T extends string>(
  valores: readonly T[],
  labels: Record<T, string>,
): { value: T; label: string }[] => valores.map((valor) => ({ value: valor, label: labels[valor] }));

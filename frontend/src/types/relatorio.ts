import type { ClassificacaoRisco, TipoRisco } from './risco.js';

export interface ItemRelatorioPGR {
  id: string;
  descricao: string;
  tipo: TipoRisco;
  severidade: number;
  probabilidade: number;
  nivelRisco: number;
  classificacao: ClassificacaoRisco;
  medidasControle: string[];
}

export interface ResumoRelatorioPGR {
  totalRiscos: number;
  porClassificacao: Record<ClassificacaoRisco, number>;
  porTipo: Record<TipoRisco, number>;
  maiorNivel: number;
}

/** Corpo do `GET /relatorios/pgr?formato=json`. */
export interface RelatorioPGR {
  empresa: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    cnae: string;
    grauRisco: number;
  };
  geradoEm: string;
  itens: ItemRelatorioPGR[];
  resumo: ResumoRelatorioPGR;
}

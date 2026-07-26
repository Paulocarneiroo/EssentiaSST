import type { ClassificacaoRisco, TipoRisco } from '../../domain/entities/Risco.js';

/** Linha do inventário de riscos já enriquecida com nível, classificação e medidas. */
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

/** Conteúdo do relatório, independente do formato de saída. */
export interface RelatorioPGR {
  empresa: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    cnae: string;
    grauRisco: number;
  };
  geradoEm: Date;
  itens: ItemRelatorioPGR[];
  resumo: ResumoRelatorioPGR;
}

export interface DocumentoExportado {
  conteudo: string;
  /** Tipo MIME para o header `Content-Type` da resposta. */
  mimeType: string;
  /** Extensão sugerida do arquivo, sem ponto. */
  extensao: string;
}

/**
 * `IExportadorRelatorio` do modelo de domínio: permite trocar o formato de saída
 * (HTML, JSON, PDF) sem alterar a lógica de composição do PGR.
 */
export interface IExportadorRelatorio {
  exportar(relatorio: RelatorioPGR): DocumentoExportado;
}

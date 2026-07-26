import type { Empresa } from '../../domain/entities/Empresa.js';
import {
  TIPOS_RISCO,
  calcularNivelRisco,
  classificarRisco,
  sugerirMedidasControle,
  type ClassificacaoRisco,
  type Risco,
  type TipoRisco,
} from '../../domain/entities/Risco.js';
import type {
  DocumentoExportado,
  IExportadorRelatorio,
  ItemRelatorioPGR,
  RelatorioPGR,
  ResumoRelatorioPGR,
} from '../ports/IExportadorRelatorio.js';

const CLASSIFICACAO_ZERADA: Record<ClassificacaoRisco, number> = {
  BAIXO: 0,
  MODERADO: 0,
  ALTO: 0,
  CRITICO: 0,
};

/**
 * `GeradorRelatorioPGR` — compila o inventário de riscos da empresa e delega a
 * saída ao exportador injetado.
 *
 * SRP: muda apenas quando muda o conteúdo do PGR, nunca por causa do formato.
 * DIP: depende de `IExportadorRelatorio`; não conhece HTML, JSON nem biblioteca de PDF.
 */
export class GeradorRelatorioPGR {
  constructor(private readonly exportador: IExportadorRelatorio) {}

  /** Compila e exporta o relatório no formato do exportador injetado. */
  gerar(empresa: Empresa, riscos: Risco[], agora = new Date()): DocumentoExportado {
    return this.exportador.exportar(this.compilar(empresa, riscos, agora));
  }

  /** Conteúdo do relatório sem exportação — útil para testes e outros consumidores. */
  compilar(empresa: Empresa, riscos: Risco[], agora = new Date()): RelatorioPGR {
    // Maior nível primeiro: o PGR prioriza o que precisa de ação imediata.
    const itens = riscos.map(paraItem).sort((a, b) => b.nivelRisco - a.nivelRisco);

    return {
      empresa: {
        razaoSocial: empresa.razaoSocial,
        nomeFantasia: empresa.nomeFantasia,
        cnpj: empresa.cnpj,
        cnae: empresa.cnae,
        grauRisco: empresa.grauRisco,
      },
      geradoEm: agora,
      itens,
      resumo: resumir(itens),
    };
  }
}

const paraItem = (risco: Risco): ItemRelatorioPGR => {
  const nivelRisco = calcularNivelRisco(risco);

  return {
    id: risco.id,
    descricao: risco.descricao,
    tipo: risco.tipo,
    severidade: risco.severidade,
    probabilidade: risco.probabilidade,
    nivelRisco,
    classificacao: classificarRisco(nivelRisco),
    medidasControle: sugerirMedidasControle(risco),
  };
};

const resumir = (itens: ItemRelatorioPGR[]): ResumoRelatorioPGR => {
  const porClassificacao = { ...CLASSIFICACAO_ZERADA };
  const porTipo = Object.fromEntries(TIPOS_RISCO.map((tipo) => [tipo, 0])) as Record<
    TipoRisco,
    number
  >;

  for (const item of itens) {
    porClassificacao[item.classificacao] += 1;
    porTipo[item.tipo] += 1;
  }

  return {
    totalRiscos: itens.length,
    porClassificacao,
    porTipo,
    maiorNivel: itens.reduce((maior, item) => Math.max(maior, item.nivelRisco), 0),
  };
};

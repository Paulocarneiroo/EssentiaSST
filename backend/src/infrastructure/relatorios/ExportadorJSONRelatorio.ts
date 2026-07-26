import type {
  DocumentoExportado,
  IExportadorRelatorio,
  RelatorioPGR,
} from '../../application/ports/IExportadorRelatorio.js';

/**
 * Exporta o PGR como JSON — formato de consumo do frontend e de integrações.
 * Demonstra a troca de formato sem alteração no `GeradorRelatorioPGR` (DIP).
 */
export class ExportadorJSONRelatorio implements IExportadorRelatorio {
  exportar(relatorio: RelatorioPGR): DocumentoExportado {
    return {
      conteudo: JSON.stringify(relatorio, null, 2),
      mimeType: 'application/json; charset=utf-8',
      extensao: 'json',
    };
  }
}

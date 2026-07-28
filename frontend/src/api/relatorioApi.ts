import { apiClient } from './client.js';
import type { RelatorioPGR } from '../types/relatorio.js';

export const relatorioApi = {
  /** Documento HTML pronto para exibição, montado pelo exportador do backend. */
  pgrHtml(): Promise<string> {
    return apiClient.request<string>('/relatorios/pgr', {
      query: { formato: 'html' },
      responseType: 'text',
    });
  },

  pgrJson(): Promise<RelatorioPGR> {
    return apiClient.request<RelatorioPGR>('/relatorios/pgr', { query: { formato: 'json' } });
  },
};

import { apiClient } from './client';
import type { EventoESocial } from '../types/evento';

export const eventoESocialApi = {
  list(): Promise<EventoESocial[]> {
    return apiClient.request<EventoESocial[]>('/eventos-esocial');
  },

  getById(id: string): Promise<EventoESocial> {
    return apiClient.request<EventoESocial>(`/eventos-esocial/${id}`);
  },

  /** XML cru do evento, como devolvido pelo backend (`application/xml`). */
  xml(id: string): Promise<string> {
    return apiClient.request<string>(`/eventos-esocial/${id}/xml`, { responseType: 'text' });
  },

  // H3.1 — geração a partir do fato de origem.
  gerarDeAso(asoId: string): Promise<EventoESocial> {
    return apiClient.request<EventoESocial>('/eventos-esocial/aso', {
      method: 'POST',
      body: { asoId },
    });
  },

  gerarDeRisco(riscoId: string, colaboradorId: string): Promise<EventoESocial> {
    return apiClient.request<EventoESocial>('/eventos-esocial/risco', {
      method: 'POST',
      body: { riscoId, colaboradorId },
    });
  },

  gerarDeAcidente(acidenteId: string): Promise<EventoESocial> {
    return apiClient.request<EventoESocial>('/eventos-esocial/acidente', {
      method: 'POST',
      body: { acidenteId },
    });
  },

  /** H3.3 — transmite ao eSocial (restrito a ADMIN). */
  enviar(id: string): Promise<EventoESocial> {
    return apiClient.request<EventoESocial>(`/eventos-esocial/${id}/enviar`, { method: 'POST' });
  },

  /** H3.4 — reenvia um evento REJEITADO após correção do fato de origem. */
  reenviar(id: string): Promise<EventoESocial> {
    return apiClient.request<EventoESocial>(`/eventos-esocial/${id}/reenviar`, { method: 'POST' });
  },
};

import { eventoESocialApi } from '../api/eventoESocialApi.js';
import type { EventoESocial, StatusEventoESocial } from '../types/evento.js';

export const eventoService = {
  /** Últimos eventos primeiro — a fila de acompanhamento da conformidade. */
  async listar(): Promise<EventoESocial[]> {
    const eventos = await eventoESocialApi.list();
    return [...eventos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async xml(id: string): Promise<string> {
    return eventoESocialApi.xml(id);
  },

  async gerarDeAso(asoId: string): Promise<EventoESocial> {
    return eventoESocialApi.gerarDeAso(asoId);
  },

  async gerarDeRisco(riscoId: string, colaboradorId: string): Promise<EventoESocial> {
    return eventoESocialApi.gerarDeRisco(riscoId, colaboradorId);
  },

  async gerarDeAcidente(acidenteId: string): Promise<EventoESocial> {
    return eventoESocialApi.gerarDeAcidente(acidenteId);
  },

  async enviar(id: string): Promise<EventoESocial> {
    return eventoESocialApi.enviar(id);
  },

  async reenviar(id: string): Promise<EventoESocial> {
    return eventoESocialApi.reenviar(id);
  },

  /** Só o estado PENDENTE segue para transmissão (H3.3). */
  podeEnviar(evento: EventoESocial): boolean {
    return evento.status === 'PENDENTE';
  },

  /** Só o estado REJEITADO admite reenvio após correção (H3.4). */
  podeReenviar(evento: EventoESocial): boolean {
    return evento.status === 'REJEITADO';
  },

  contarPorStatus(eventos: EventoESocial[]): Record<StatusEventoESocial, number> {
    const contagem: Record<StatusEventoESocial, number> = {
      PENDENTE: 0,
      ENVIADO: 0,
      ACEITO: 0,
      REJEITADO: 0,
    };
    for (const evento of eventos) {
      contagem[evento.status] += 1;
    }
    return contagem;
  },
};

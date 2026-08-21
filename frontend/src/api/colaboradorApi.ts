import { apiClient } from './client';
import type { AvaliacaoAptidao } from '../types/aptidao';
import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../types/colaborador';

export const colaboradorApi = {
  list(): Promise<Colaborador[]> {
    return apiClient.request<Colaborador[]>('/colaboradores');
  },

  getById(id: string): Promise<Colaborador> {
    return apiClient.request<Colaborador>(`/colaboradores/${id}`);
  },

  create(data: CreateColaboradorData): Promise<Colaborador> {
    return apiClient.request<Colaborador>('/colaboradores', { method: 'POST', body: data });
  },

  update(id: string, data: UpdateColaboradorData): Promise<Colaborador> {
    return apiClient.request<Colaborador>(`/colaboradores/${id}`, { method: 'PUT', body: data });
  },

  remove(id: string): Promise<void> {
    return apiClient.request<void>(`/colaboradores/${id}`, { method: 'DELETE' });
  },

  aptidao(id: string): Promise<AvaliacaoAptidao> {
    return apiClient.request<AvaliacaoAptidao>(`/colaboradores/${id}/aptidao`);
  },
};

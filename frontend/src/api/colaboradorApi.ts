import { apiClient } from './client.js';
import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../types/colaborador.js';

export const colaboradorApi = {
  list(empresaId?: string): Promise<Colaborador[]> {
    const query = empresaId ? `?empresaId=${encodeURIComponent(empresaId)}` : '';
    return apiClient.request<Colaborador[]>(`/colaboradores${query}`);
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
};

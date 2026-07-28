import { apiClient } from './client.js';
import type { Acidente, CreateAcidenteData, UpdateAcidenteData } from '../types/acidente.js';

export const acidenteApi = {
  list(colaboradorId?: string): Promise<Acidente[]> {
    return apiClient.request<Acidente[]>('/acidentes', { query: { colaboradorId } });
  },

  getById(id: string): Promise<Acidente> {
    return apiClient.request<Acidente>(`/acidentes/${id}`);
  },

  create(data: CreateAcidenteData): Promise<Acidente> {
    return apiClient.request<Acidente>('/acidentes', { method: 'POST', body: data });
  },

  update(id: string, data: UpdateAcidenteData): Promise<Acidente> {
    return apiClient.request<Acidente>(`/acidentes/${id}`, { method: 'PUT', body: data });
  },

  remove(id: string): Promise<void> {
    return apiClient.request<void>(`/acidentes/${id}`, { method: 'DELETE' });
  },
};

import { apiClient } from './client.js';
import type { CreateRiscoData, Risco, UpdateRiscoData } from '../types/risco.js';

export const riscoApi = {
  list(): Promise<Risco[]> {
    return apiClient.request<Risco[]>('/riscos');
  },

  getById(id: string): Promise<Risco> {
    return apiClient.request<Risco>(`/riscos/${id}`);
  },

  create(data: CreateRiscoData): Promise<Risco> {
    return apiClient.request<Risco>('/riscos', { method: 'POST', body: data });
  },

  update(id: string, data: UpdateRiscoData): Promise<Risco> {
    return apiClient.request<Risco>(`/riscos/${id}`, { method: 'PUT', body: data });
  },

  remove(id: string): Promise<void> {
    return apiClient.request<void>(`/riscos/${id}`, { method: 'DELETE' });
  },
};

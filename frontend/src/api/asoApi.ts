import { apiClient } from './client';
import type { Aso, CreateAsoData, UpdateAsoData } from '../types/aso';

export const asoApi = {
  list(colaboradorId?: string): Promise<Aso[]> {
    return apiClient.request<Aso[]>('/asos', { query: { colaboradorId } });
  },

  getById(id: string): Promise<Aso> {
    return apiClient.request<Aso>(`/asos/${id}`);
  },

  create(data: CreateAsoData): Promise<Aso> {
    return apiClient.request<Aso>('/asos', { method: 'POST', body: data });
  },

  update(id: string, data: UpdateAsoData): Promise<Aso> {
    return apiClient.request<Aso>(`/asos/${id}`, { method: 'PUT', body: data });
  },

  remove(id: string): Promise<void> {
    return apiClient.request<void>(`/asos/${id}`, { method: 'DELETE' });
  },
};

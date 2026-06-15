import { apiClient } from './client.js';
import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../types/empresa.js';

export const empresaApi = {
  list(): Promise<Empresa[]> {
    return apiClient.request<Empresa[]>('/empresas');
  },

  create(data: CreateEmpresaData): Promise<Empresa> {
    return apiClient.request<Empresa>('/empresas', { method: 'POST', body: data });
  },

  update(id: string, data: UpdateEmpresaData): Promise<Empresa> {
    return apiClient.request<Empresa>(`/empresas/${id}`, { method: 'PUT', body: data });
  },

  remove(id: string): Promise<void> {
    return apiClient.request<void>(`/empresas/${id}`, { method: 'DELETE' });
  },
};

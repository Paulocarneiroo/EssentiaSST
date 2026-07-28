import { apiClient } from './client.js';
import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../types/empresa.js';

export const empresaApi = {
  /** Escopada ao tenant: devolve apenas a empresa do usuário autenticado. */
  list(): Promise<Empresa[]> {
    return apiClient.request<Empresa[]>('/empresas');
  },

  getById(id: string): Promise<Empresa> {
    return apiClient.request<Empresa>(`/empresas/${id}`);
  },

  /** Pública: cadastro do tenant antes de existir qualquer usuário. */
  create(data: CreateEmpresaData): Promise<Empresa> {
    return apiClient.request<Empresa>('/empresas', { method: 'POST', body: data, auth: false });
  },

  update(id: string, data: UpdateEmpresaData): Promise<Empresa> {
    return apiClient.request<Empresa>(`/empresas/${id}`, { method: 'PUT', body: data });
  },

  remove(id: string): Promise<void> {
    return apiClient.request<void>(`/empresas/${id}`, { method: 'DELETE' });
  },
};

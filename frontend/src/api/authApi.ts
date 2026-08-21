import { apiClient } from './client';
import type { AuthResult, LoginData, RegisterData, Usuario } from '../types/usuario';

export const authApi = {
  login(data: LoginData): Promise<AuthResult> {
    return apiClient.request<AuthResult>('/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  /** Primeiro ADMIN de uma empresa que ainda não tem usuários — rota pública. */
  bootstrap(data: RegisterData): Promise<AuthResult> {
    return apiClient.request<AuthResult>('/auth/bootstrap', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  /** Registro feito por um ADMIN autenticado; o backend força o tenant de quem registra. */
  register(data: RegisterData): Promise<AuthResult> {
    return apiClient.request<AuthResult>('/auth/register', { method: 'POST', body: data });
  },

  me(): Promise<Usuario> {
    return apiClient.request<Usuario>('/auth/me');
  },
};

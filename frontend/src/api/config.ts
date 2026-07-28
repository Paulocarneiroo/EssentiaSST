const STORAGE_KEY = 'essentia:api-base-url';

/**
 * Endereço padrão da API. Pode ser sobrescrito em tempo de execução (tela de login),
 * o que permite usar o front de uma máquina e a API/Docker de outra na mesma rede.
 */
export const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

const normalize = (url: string): string => url.trim().replace(/\/+$/, '');

export const getApiBaseUrl = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? normalize(stored) : DEFAULT_API_BASE_URL;
};

export const setApiBaseUrl = (url: string): void => {
  const normalized = normalize(url);
  if (!normalized || normalized === DEFAULT_API_BASE_URL) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, normalized);
};

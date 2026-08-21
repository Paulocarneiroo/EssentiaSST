const STORAGE_KEY = 'essentia:api-base-url';

const normalize = (url: string): string => url.trim().replace(/\/+$/, '');

const FALLBACK_API_BASE_URL = 'http://localhost:3000/api';

/** Vem de `VITE_API_BASE_URL` no `.env`, injetado pelo Vite em tempo de build. */
const fromEnvFile = (): string | null => {
  const url = import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL;
  return url ? normalize(url) : null;
};

/**
 * Endereço padrão da API: o valor do .env, se houver, senão localhost.
 * Pode ser sobrescrito em tempo de execução (tela de login), o que permite usar
 * o front de uma máquina e a API/Docker de outra na mesma rede.
 */
export const DEFAULT_API_BASE_URL = fromEnvFile() ?? FALLBACK_API_BASE_URL;

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

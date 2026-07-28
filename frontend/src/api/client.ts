import { getApiBaseUrl } from './config.js';
import { clearSessao, getToken } from '../state/session.js';
import type { ApiError } from '../types/api.js';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** `text` preserva a resposta crua (XML do evento, HTML do PGR). */
  responseType?: 'json' | 'text';
  /** Envia o Bearer token. Desligado no login/bootstrap, que são públicos. */
  auth?: boolean;
}

/** Chamado quando o servidor recusa o token — a UI derruba a sessão e volta ao login (H2.3). */
type SessionExpiredHandler = () => void;

let onSessionExpired: SessionExpiredHandler = () => {};

export const setSessionExpiredHandler = (handler: SessionExpiredHandler): void => {
  onSessionExpired = handler;
};

const buildQuery = (query?: Record<string, QueryValue>): string => {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
};

const parseError = async (response: Response): Promise<HttpError> => {
  try {
    const payload = (await response.clone().json()) as ApiError;
    return new HttpError(
      response.status,
      payload.error ?? 'RequestError',
      payload.message ?? 'Erro na requisição.',
    );
  } catch {
    return new HttpError(
      response.status,
      'RequestError',
      response.statusText || 'Erro na requisição.',
    );
  }
};

export const apiClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, responseType = 'json', auth = true } = options;

    const headers: Record<string, string> = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const token = auth ? getToken() : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${getApiBaseUrl()}${path}${buildQuery(query)}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new HttpError(
        0,
        'NetworkError',
        'Não foi possível falar com a API. Verifique se o servidor está no ar e o endereço configurado.',
      );
    }

    if (!response.ok) {
      // Só derruba a sessão em requisição autenticada: no login, 401 é credencial inválida.
      if (response.status === 401 && token) {
        clearSessao();
        onSessionExpired();
      }
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (responseType === 'text') {
      return (await response.text()) as T;
    }

    return (await response.json()) as T;
  },
};

import { API_BASE_URL } from './config.js';
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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

const parseError = async (response: Response): Promise<HttpError> => {
  try {
    const payload = (await response.json()) as ApiError;
    return new HttpError(
      response.status,
      payload.error ?? 'RequestError',
      payload.message ?? 'Erro na requisição.',
    );
  } catch {
    return new HttpError(response.status, 'RequestError', response.statusText || 'Erro na requisição.');
  }
};

export const apiClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body } = options;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  },
};

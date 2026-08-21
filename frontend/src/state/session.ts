import { createStore } from './store';
import type { Papel, Usuario } from '../types/usuario';

const STORAGE_KEY = 'essentia:sessao';

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export interface SessionState {
  sessao: Sessao | null;
}

/** Recupera a sessão persistida; descarta o registro se estiver corrompido. */
const restore = (): Sessao | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Sessao;
    return parsed?.token && parsed?.usuario?.id ? parsed : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const sessionStore = createStore<SessionState>({ sessao: restore() });

export const getSessao = (): Sessao | null => sessionStore.getState().sessao;

export const getToken = (): string | null => getSessao()?.token ?? null;

export const getUsuario = (): Usuario | null => getSessao()?.usuario ?? null;

/** Tenant do usuário autenticado: toda escrita do domínio nasce vinculada a ele (H1.3). */
export const getEmpresaId = (): string | null => getUsuario()?.empresaId ?? null;

export const isAutenticado = (): boolean => getSessao() !== null;

export const temPapel = (...papeis: Papel[]): boolean => {
  const usuario = getUsuario();
  return usuario ? papeis.includes(usuario.papel) : false;
};

export const isAdmin = (): boolean => temPapel('ADMIN');

export const setSessao = (sessao: Sessao): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
  sessionStore.setState({ sessao });
};

/** Atualiza os dados do usuário mantendo o token corrente (resposta de `GET /auth/me`). */
export const setUsuario = (usuario: Usuario): void => {
  const atual = getSessao();
  if (!atual) return;
  setSessao({ ...atual, usuario });
};

export const clearSessao = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  sessionStore.setState({ sessao: null });
};

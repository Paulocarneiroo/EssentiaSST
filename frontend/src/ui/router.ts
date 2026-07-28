import { isAdmin, isAutenticado } from '../state/session.js';
import { alertBox, loading, pageHeader } from './components.js';

export type RouteParams = Record<string, string>;

export interface Rota {
  /** Padrão com segmentos dinâmicos, ex.: `/colaboradores/:id`. */
  path: string;
  titulo: string;
  render: (root: HTMLElement, params: RouteParams) => Promise<void> | void;
  /** Acessível sem sessão (apenas login/primeiro acesso). */
  publica?: boolean;
  /** H2.3 — telas de ação restrita ao papel ADMIN. */
  somenteAdmin?: boolean;
}

let rotas: Rota[] = [];
let rotaCorrente = '';

const appRoot = (): HTMLElement => {
  const root = document.getElementById('app');
  if (!root) throw new Error('Elemento #app não encontrado.');
  return root;
};

const caminhoAtual = (): string => {
  const hash = window.location.hash.replace(/^#/, '');
  const caminho = hash.split('?')[0];
  return caminho.startsWith('/') ? caminho : `/${caminho}`;
};

const casar = (padrao: string, caminho: string): RouteParams | null => {
  const segmentosPadrao = padrao.split('/').filter(Boolean);
  const segmentosCaminho = caminho.split('/').filter(Boolean);

  if (segmentosPadrao.length !== segmentosCaminho.length) return null;

  const params: RouteParams = {};
  for (let i = 0; i < segmentosPadrao.length; i += 1) {
    const segmento = segmentosPadrao[i];
    if (segmento.startsWith(':')) {
      params[segmento.slice(1)] = decodeURIComponent(segmentosCaminho[i]);
    } else if (segmento !== segmentosCaminho[i]) {
      return null;
    }
  }
  return params;
};

const encontrarRota = (caminho: string): { rota: Rota; params: RouteParams } | null => {
  for (const rota of rotas) {
    const params = casar(rota.path, caminho);
    if (params) return { rota, params };
  }
  return null;
};

export const navegar = (caminho: string, { substituir = false } = {}): void => {
  const hash = `#${caminho}`;
  if (window.location.hash === hash) {
    void processarRota();
    return;
  }
  if (substituir) {
    window.location.replace(hash);
    return;
  }
  window.location.hash = hash;
};

export const caminhoCorrente = (): string => rotaCorrente;

/** Assinantes redesenham cromo externo (navbar) quando a rota muda. */
type ListenerRota = (caminho: string) => void;
const listeners = new Set<ListenerRota>();

export const aoMudarRota = (listener: ListenerRota): void => {
  listeners.add(listener);
};

const naoEncontrada = (root: HTMLElement): void => {
  root.innerHTML = `
    ${pageHeader({ titulo: 'Página não encontrada', subtitulo: 'O endereço acessado não existe.' })}
    <a class="btn btn-primary" href="#/">Ir para o painel</a>
  `;
};

const semPermissao = (root: HTMLElement): void => {
  root.innerHTML = `
    ${pageHeader({
      titulo: 'Acesso restrito',
      subtitulo: 'Esta área é exclusiva de administradores.',
    })}
    ${alertBox('Seu perfil de operador não permite acessar esta tela. Fale com um administrador da empresa.', 'warning')}
  `;
};

const processarRota = async (): Promise<void> => {
  const caminho = caminhoAtual();
  const root = appRoot();
  const encontrada = encontrarRota(caminho);

  // Sem sessão só existe a área pública; com sessão, o login não faz sentido.
  if (!encontrada?.rota.publica && !isAutenticado()) {
    navegar('/login', { substituir: true });
    return;
  }
  if (encontrada?.rota.publica && isAutenticado()) {
    navegar('/', { substituir: true });
    return;
  }

  rotaCorrente = caminho;
  listeners.forEach((listener) => listener(caminho));

  if (!encontrada) {
    naoEncontrada(root);
    return;
  }

  const { rota, params } = encontrada;

  if (rota.somenteAdmin && !isAdmin()) {
    semPermissao(root);
    return;
  }

  document.title = `${rota.titulo} · EssentiaSST`;
  root.innerHTML = loading();
  window.scrollTo({ top: 0 });

  try {
    await rota.render(root, params);
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : 'Não foi possível carregar esta página.';
    root.innerHTML = `
      ${pageHeader({ titulo: rota.titulo })}
      ${alertBox(mensagem)}
    `;
  }
};

export const iniciarRouter = (definicoes: Rota[]): void => {
  rotas = definicoes;
  window.addEventListener('hashchange', () => void processarRota());

  if (!window.location.hash) {
    navegar(isAutenticado() ? '/' : '/login', { substituir: true });
    return;
  }

  void processarRota();
};

/** Recarrega a rota atual — usado após uma ação mudar os dados exibidos. */
export const recarregarRota = (): void => {
  void processarRota();
};

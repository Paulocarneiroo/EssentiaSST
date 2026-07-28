import { authService } from '../services/authService.js';
import { LABEL_PAPEL } from '../services/labels.js';
import { getUsuario, isAdmin, sessionStore } from '../state/session.js';
import { esc } from './html.js';
import { caminhoCorrente, navegar } from './router.js';

interface ItemNav {
  caminho: string;
  label: string;
  somenteAdmin?: boolean;
}

const NAV: ItemNav[] = [
  { caminho: '/', label: 'Painel' },
  { caminho: '/colaboradores', label: 'Colaboradores' },
  { caminho: '/asos', label: 'ASOs' },
  { caminho: '/riscos', label: 'Riscos (PGR)' },
  { caminho: '/acidentes', label: 'Acidentes (CAT)' },
  { caminho: '/esocial', label: 'eSocial' },
  { caminho: '/pgr', label: 'Relatório PGR' },
];

const NAV_CONTA: ItemNav[] = [
  { caminho: '/empresa', label: 'Dados da empresa' },
  { caminho: '/usuarios', label: 'Usuários', somenteAdmin: true },
];

const ativo = (caminho: string, atual: string): boolean =>
  caminho === '/' ? atual === '/' : atual.startsWith(caminho);

const linkNav = (item: ItemNav, atual: string): string => `
  <li class="nav-item">
    <a class="nav-link ${ativo(item.caminho, atual) ? 'active' : ''}" href="#${esc(item.caminho)}">
      ${esc(item.label)}
    </a>
  </li>
`;

const menuUsuario = (): string => {
  const usuario = getUsuario();
  if (!usuario) return '';

  const itensConta = NAV_CONTA.filter((item) => !item.somenteAdmin || isAdmin())
    .map(
      (item) =>
        `<li><a class="dropdown-item" href="#${esc(item.caminho)}">${esc(item.label)}</a></li>`,
    )
    .join('');

  return `
    <div class="dropdown">
      <button
        class="btn btn-sm btn-user dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <span class="avatar" aria-hidden="true">${esc(usuario.nome.trim().charAt(0).toUpperCase())}</span>
        <span class="d-none d-md-inline">${esc(usuario.nome)}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li class="dropdown-header">
          <span class="d-block fw-semibold">${esc(usuario.email)}</span>
          <span class="text-muted">${esc(LABEL_PAPEL[usuario.papel])}</span>
        </li>
        <li><hr class="dropdown-divider" /></li>
        ${itensConta}
        <li><hr class="dropdown-divider" /></li>
        <li><button class="dropdown-item text-danger" type="button" data-action="sair">Sair</button></li>
      </ul>
    </div>
  `;
};

const navbarElemento = (): HTMLElement => {
  const elemento = document.getElementById('navbar');
  if (!elemento) throw new Error('Elemento #navbar não encontrado.');
  return elemento;
};

/** Redesenha a barra de navegação a partir da sessão e da rota corrente. */
export const renderLayout = (): void => {
  const elemento = navbarElemento();
  const usuario = getUsuario();

  if (!usuario) {
    elemento.innerHTML = '';
    elemento.classList.add('d-none');
    return;
  }

  elemento.classList.remove('d-none');
  const atual = caminhoCorrente();

  elemento.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark app-navbar shadow-sm">
      <div class="container">
        <a class="navbar-brand fw-semibold" href="#/">Essentia<span class="brand-accent">SST</span></a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Alternar navegação"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            ${NAV.map((item) => linkNav(item, atual)).join('')}
          </ul>
          ${menuUsuario()}
        </div>
      </div>
    </nav>
  `;

  elemento.querySelector('[data-action="sair"]')?.addEventListener('click', () => {
    authService.logout();
    navegar('/login');
  });
};

/** Mantém o cromo sincronizado com sessão e rota. */
export const iniciarLayout = (): void => {
  sessionStore.subscribe(() => renderLayout());
  renderLayout();
};

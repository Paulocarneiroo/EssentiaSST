import type { Variant } from '../services/labels.js';
import { esc } from './html.js';

export interface PageHeaderOptions {
  titulo: string;
  subtitulo?: string;
  /** HTML já montado (botões de ação da página). */
  acoes?: string;
  voltar?: { href: string; label: string };
}

export const pageHeader = ({ titulo, subtitulo, acoes, voltar }: PageHeaderOptions): string => `
  <header class="page-header">
    ${voltar ? `<a class="back-link" href="${esc(voltar.href)}">&larr; ${esc(voltar.label)}</a>` : ''}
    <div class="page-header-row">
      <div>
        <h1>${esc(titulo)}</h1>
        ${subtitulo ? `<p class="text-muted mb-0">${esc(subtitulo)}</p>` : ''}
      </div>
      ${acoes ? `<div class="page-header-actions">${acoes}</div>` : ''}
    </div>
  </header>
`;

export const badge = (label: string, variant: Variant = 'secondary'): string =>
  `<span class="badge text-bg-${variant}">${esc(label)}</span>`;

export const loading = (mensagem = 'Carregando...'): string => `
  <div class="loading-overlay">
    <div class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></div>
    <span>${esc(mensagem)}</span>
  </div>
`;

export const emptyState = (mensagem: string, acao = ''): string => `
  <div class="empty-state">
    <p class="mb-${acao ? '3' : '0'}">${esc(mensagem)}</p>
    ${acao}
  </div>
`;

export const alertBox = (mensagem: string, variant: Variant = 'danger'): string =>
  `<div class="alert alert-${variant} mb-0" role="alert">${esc(mensagem)}</div>`;

export interface StatCardOptions {
  label: string;
  valor: string | number;
  detalhe?: string;
  variant?: Variant;
  href?: string;
}

export const statCard = ({ label, valor, detalhe, variant, href }: StatCardOptions): string => {
  const conteudo = `
    <span class="stat-label">${esc(label)}</span>
    <strong class="stat-value ${variant ? `text-${variant}` : ''}">${esc(valor)}</strong>
    ${detalhe ? `<span class="stat-detail">${esc(detalhe)}</span>` : ''}
  `;

  return href
    ? `<a class="stat-card stat-card-link" href="${esc(href)}">${conteudo}</a>`
    : `<div class="stat-card">${conteudo}</div>`;
};

export interface TableOptions {
  colunas: string[];
  /** Cada item já é um `<tr>` montado. */
  linhas: string[];
  vazio: string;
}

export const table = ({ colunas, linhas, vazio }: TableOptions): string => {
  if (linhas.length === 0) {
    return emptyState(vazio);
  }

  return `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr>${colunas.map((coluna) => `<th>${coluna}</th>`).join('')}</tr>
        </thead>
        <tbody>${linhas.join('')}</tbody>
      </table>
    </div>
  `;
};

export const card = (conteudo: string, classe = ''): string =>
  `<div class="card app-card ${classe}"><div class="card-body">${conteudo}</div></div>`;

export const cardTabela = (titulo: string, conteudo: string, acoes = ''): string => `
  <div class="card app-card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h2 class="h6 mb-0">${esc(titulo)}</h2>
      ${acoes}
    </div>
    <div class="card-body p-0">${conteudo}</div>
  </div>
`;

/** Lista de pares rótulo/valor; o valor pode conter HTML já escapado (badges). */
export const definitionList = (itens: { termo: string; valor: string }[]): string => `
  <dl class="definition-list">
    ${itens
      .map(
        ({ termo, valor }) => `
          <div>
            <dt>${esc(termo)}</dt>
            <dd>${valor}</dd>
          </div>
        `,
      )
      .join('')}
  </dl>
`;

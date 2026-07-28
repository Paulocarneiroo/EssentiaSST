import { esc } from './html.js';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

const toastContainer = (): HTMLElement => {
  const container = document.getElementById('toast-container');
  if (!container) {
    throw new Error('Container de toast não encontrado.');
  }
  return container;
};

let contador = 0;

export const showToast = (mensagem: string, variant: ToastVariant = 'success'): void => {
  const container = toastContainer();
  const id = `toast-${++contador}-${Date.now()}`;
  // Fundo claro no aviso mantém o contraste do texto escuro do Bootstrap.
  const fecharEscuro = variant === 'warning' ? '' : 'btn-close-white';

  container.insertAdjacentHTML(
    'beforeend',
    `
      <div id="${id}" class="toast align-items-center text-bg-${variant} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${esc(mensagem)}</div>
          <button type="button" class="btn-close ${fecharEscuro} me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
      </div>
    `,
  );

  const elemento = document.getElementById(id);
  if (!elemento) return;

  const toast = new bootstrap.Toast(elemento, { delay: variant === 'danger' ? 6000 : 4000 });
  elemento.addEventListener('hidden.bs.toast', () => elemento.remove());
  toast.show();
};

export const toastErro = (error: unknown, fallback: string): void => {
  showToast(error instanceof Error ? error.message : fallback, 'danger');
};

import { esc } from './html.js';

const modalContainer = (): HTMLElement => {
  const container = document.getElementById('modal-container');
  if (!container) {
    throw new Error('Container de modal não encontrado.');
  }
  return container;
};

type Tamanho = 'sm' | 'md' | 'lg' | 'xl';

const classeTamanho = (tamanho: Tamanho): string =>
  tamanho === 'md' ? '' : `modal-${tamanho}`;

let contador = 0;
const proximoId = (): string => `modal-${++contador}-${Date.now()}`;

export interface FormModalOptions {
  titulo: string;
  /** HTML dos campos, já dentro de um grid `row g-3`. */
  campos: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tamanho?: Tamanho;
  /** Lança para manter o modal aberto exibindo a mensagem do erro. */
  onConfirm: (form: HTMLFormElement) => Promise<void>;
}

export const openFormModal = ({
  titulo,
  campos,
  confirmLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  tamanho = 'lg',
  onConfirm,
}: FormModalOptions): void => {
  const id = proximoId();

  modalContainer().insertAdjacentHTML(
    'beforeend',
    `
      <div id="${id}" class="modal fade" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${classeTamanho(tamanho)}">
          <div class="modal-content">
            <form novalidate>
              <div class="modal-header">
                <h2 class="modal-title h5">${esc(titulo)}</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
              </div>
              <div class="modal-body">
                <div class="alert alert-danger d-none" role="alert" data-role="erro"></div>
                <div class="row g-3">${campos}</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${esc(cancelLabel)}</button>
                <button type="submit" class="btn btn-primary">${esc(confirmLabel)}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,
  );

  const elemento = document.getElementById(id);
  if (!elemento) return;

  const form = elemento.querySelector('form') as HTMLFormElement;
  const botao = elemento.querySelector('button[type="submit"]') as HTMLButtonElement;
  const erro = elemento.querySelector('[data-role="erro"]') as HTMLElement;
  const modal = new bootstrap.Modal(elemento);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    erro.classList.add('d-none');
    botao.disabled = true;
    const rotuloOriginal = botao.innerHTML;
    botao.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Salvando...';

    try {
      await onConfirm(form);
      modal.hide();
    } catch (error) {
      // O modal continua aberto para que o usuário corrija sem redigitar tudo.
      erro.textContent =
        error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
      erro.classList.remove('d-none');
    } finally {
      botao.disabled = false;
      botao.innerHTML = rotuloOriginal;
    }
  });

  elemento.addEventListener('hidden.bs.modal', () => elemento.remove());
  modal.show();
};

export interface ConfirmOptions {
  titulo: string;
  mensagem: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
}

/** Confirmação em modal (substitui `window.confirm`) resolvida com a escolha do usuário. */
export const openConfirm = ({
  titulo,
  mensagem,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    const id = proximoId();

    modalContainer().insertAdjacentHTML(
      'beforeend',
      `
        <div id="${id}" class="modal fade" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title h5">${esc(titulo)}</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
              </div>
              <div class="modal-body"><p class="mb-0">${esc(mensagem)}</p></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${esc(cancelLabel)}</button>
                <button type="button" class="btn btn-${variant}" data-role="confirmar">${esc(confirmLabel)}</button>
              </div>
            </div>
          </div>
        </div>
      `,
    );

    const elemento = document.getElementById(id);
    if (!elemento) {
      resolve(false);
      return;
    }

    let confirmado = false;
    const modal = new bootstrap.Modal(elemento);

    elemento.querySelector('[data-role="confirmar"]')?.addEventListener('click', () => {
      confirmado = true;
      modal.hide();
    });

    elemento.addEventListener('hidden.bs.modal', () => {
      elemento.remove();
      resolve(confirmado);
    });

    modal.show();
  });

export interface InfoModalOptions {
  titulo: string;
  /** HTML já montado e escapado pelo chamador. */
  corpo: string;
  tamanho?: Tamanho;
  /** Botões extras no rodapé; recebem o elemento do modal para se registrarem. */
  acoes?: string;
  onMount?: (elemento: HTMLElement) => void;
}

export const openInfoModal = ({
  titulo,
  corpo,
  tamanho = 'lg',
  acoes = '',
  onMount,
}: InfoModalOptions): void => {
  const id = proximoId();

  modalContainer().insertAdjacentHTML(
    'beforeend',
    `
      <div id="${id}" class="modal fade" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${classeTamanho(tamanho)}">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="modal-title h5">${esc(titulo)}</h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">${corpo}</div>
            <div class="modal-footer">
              ${acoes}
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
          </div>
        </div>
      </div>
    `,
  );

  const elemento = document.getElementById(id);
  if (!elemento) return;

  onMount?.(elemento);
  elemento.addEventListener('hidden.bs.modal', () => elemento.remove());
  new bootstrap.Modal(elemento).show();
};

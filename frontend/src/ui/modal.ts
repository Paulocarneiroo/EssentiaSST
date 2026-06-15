const modalContainer = (): HTMLElement => {
  const container = document.getElementById('modal-container');
  if (!container) {
    throw new Error('Container de modal não encontrado.');
  }
  return container;
};

export interface FormModalOptions {
  title: string;

  fields: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (form: HTMLFormElement) => Promise<void>;
}

export const openFormModal = (options: FormModalOptions): void => {
  const { title, fields, confirmLabel = 'Salvar', cancelLabel = 'Cancelar', onConfirm } = options;
  const modalId = `modal-${Date.now()}`;

  modalContainer().insertAdjacentHTML(
    'beforeend',
    `
      <div id="${modalId}" class="modal fade" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <form class="modal-form" novalidate>
              <div class="modal-header">
                <h2 class="modal-title h5">${title}</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
              </div>
              <div class="modal-body">
                <div class="row g-3">${fields}</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${cancelLabel}</button>
                <button type="submit" class="btn btn-primary">${confirmLabel}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,
  );

  const element = document.getElementById(modalId);
  if (!element) return;

  const form = element.querySelector('form') as HTMLFormElement;
  const submitButton = element.querySelector('button[type="submit"]') as HTMLButtonElement;
  const modal = new bootstrap.Modal(element);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    try {
      await onConfirm(form);
      modal.hide();
    } catch {
    } finally {
      submitButton.disabled = false;
    }
  });

  element.addEventListener('hidden.bs.modal', () => element.remove());
  modal.show();
};

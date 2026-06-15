const toastContainer = (): HTMLElement => {
  const container = document.getElementById('toast-container');
  if (!container) {
    throw new Error('Container de toast não encontrado.');
  }
  return container;
};

export const showToast = (message: string, variant: 'success' | 'danger' = 'success'): void => {
  const container = toastContainer();
  const toastId = `toast-${Date.now()}`;

  container.insertAdjacentHTML(
    'beforeend',
    `
      <div id="${toastId}" class="toast align-items-center text-bg-${variant} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
      </div>
    `,
  );

  const element = document.getElementById(toastId);
  if (!element) return;

  const toast = new bootstrap.Toast(element, { delay: 4000 });
  element.addEventListener('hidden.bs.toast', () => element.remove());
  toast.show();
};

import { empresaService } from '../services/empresaService.js';
import {
  appStore,
  setEmpresas,
  setError,
  setLoadingEmpresas,
  upsertEmpresa,
  type AppState,
} from '../state/appState.js';
import type { CreateEmpresaData, Empresa } from '../types/empresa.js';
import { openFormModal } from './modal.js';
import { showToast } from './toast.js';

const appRoot = (): HTMLElement => {
  const root = document.getElementById('app');
  if (!root) throw new Error('Elemento #app não encontrado.');
  return root;
};

const renderLoading = (): string => `
  <div class="loading-overlay">
    <div class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></div>
    <span>Carregando empresas...</span>
  </div>
`;

const renderTable = (state: AppState): string => {
  if (state.loadingEmpresas) return renderLoading();

  if (state.empresas.length === 0) {
    return '<div class="empty-state">Nenhuma empresa cadastrada.</div>';
  }

  const rows = state.empresas
    .map(
      (empresa) => `
        <tr>
          <td>${empresaService.formatCnpj(empresa.cnpj)}</td>
          <td>${empresa.razaoSocial}</td>
          <td>${empresa.nomeFantasia}</td>
          <td>${empresa.cnae}</td>
          <td><span class="badge text-bg-secondary">Grau ${empresa.grauRisco}</span></td>
          <td class="text-end">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary me-2"
              data-action="edit-empresa"
              data-id="${empresa.id}"
            >
              Editar
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger btn-delete"
              data-action="delete-empresa"
              data-id="${empresa.id}"
              data-name="${empresa.razaoSocial}"
            >
              Remover
            </button>
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>CNPJ</th>
            <th>Razão Social</th>
            <th>Nome Fantasia</th>
            <th>CNAE</th>
            <th>Grau de Risco</th>
            <th class="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

const GRAU_RISCO_OPTIONS = [
  { value: 1, label: '1 — Risco mínimo' },
  { value: 2, label: '2 — Risco baixo' },
  { value: 3, label: '3 — Risco médio' },
  { value: 4, label: '4 — Risco alto' },
];

const renderGrauRiscoOptions = (selected?: number): string =>
  [
    '<option value="">Selecione</option>',
    ...GRAU_RISCO_OPTIONS.map(
      ({ value, label }) =>
        `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`,
    ),
  ].join('');

const renderEmpresaFields = (empresa?: Empresa): string => `
  <div class="col-md-6">
    <label for="cnpj" class="form-label">CNPJ</label>
    <input type="text" class="form-control" id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" required maxlength="18" value="${empresa ? empresaService.formatCnpj(empresa.cnpj) : ''}" />
  </div>
  <div class="col-md-6">
    <label for="grauRisco" class="form-label">Grau de Risco</label>
    <select class="form-select" id="grauRisco" name="grauRisco" required>
      ${renderGrauRiscoOptions(empresa?.grauRisco)}
    </select>
  </div>
  <div class="col-md-6">
    <label for="razaoSocial" class="form-label">Razão Social</label>
    <input type="text" class="form-control" id="razaoSocial" name="razaoSocial" required value="${empresa?.razaoSocial ?? ''}" />
  </div>
  <div class="col-md-6">
    <label for="nomeFantasia" class="form-label">Nome Fantasia</label>
    <input type="text" class="form-control" id="nomeFantasia" name="nomeFantasia" required value="${empresa?.nomeFantasia ?? ''}" />
  </div>
  <div class="col-md-6">
    <label for="cnae" class="form-label">CNAE</label>
    <input type="text" class="form-control" id="cnae" name="cnae" maxlength="10" required value="${empresa?.cnae ?? ''}" />
  </div>
`;

const readEmpresaForm = (form: HTMLFormElement): CreateEmpresaData => {
  const formData = new FormData(form);
  return {
    cnpj: String(formData.get('cnpj') ?? ''),
    razaoSocial: String(formData.get('razaoSocial') ?? ''),
    nomeFantasia: String(formData.get('nomeFantasia') ?? ''),
    cnae: String(formData.get('cnae') ?? ''),
    grauRisco: Number(formData.get('grauRisco')),
  };
};

const renderForm = (): string => `
  <form id="empresa-form" class="row g-3" novalidate>
    ${renderEmpresaFields()}
    <div class="col-12">
      <button type="submit" class="btn btn-primary">Cadastrar empresa</button>
    </div>
  </form>
`;

export const renderEmpresaView = (state: AppState): void => {
  appRoot().innerHTML = `
    <section>
      <header class="page-header">
        <h1>Empresas</h1>
        <p class="text-muted mb-0">Gerencie as empresas cadastradas na plataforma.</p>
      </header>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card card-form">
            <div class="card-body">
              <h2 class="h5 mb-3">Nova empresa</h2>
              ${renderForm()}
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card table-card">
            <div class="card-body p-0">
              ${renderTable(state)}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  bindEmpresaEvents();
};

const bindEmpresaEvents = (): void => {
  const form = document.getElementById('empresa-form') as HTMLFormElement | null;
  form?.addEventListener('submit', handleCreate);

  document.querySelectorAll('[data-action="edit-empresa"]').forEach((button) => {
    button.addEventListener('click', handleEdit);
  });

  document.querySelectorAll('[data-action="delete-empresa"]').forEach((button) => {
    button.addEventListener('click', handleDelete);
  });
};

const handleCreate = async (event: Event): Promise<void> => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;

  try {
    setError(null);
    const created = await empresaService.create(readEmpresaForm(form));
    setEmpresas([created, ...appStore.getState().empresas]);
    form.reset();
    showToast('Empresa cadastrada com sucesso.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível cadastrar a empresa.';
    setError(message);
    showToast(message, 'danger');
  }
};

const handleEdit = (event: Event): void => {
  const button = event.currentTarget as HTMLButtonElement;
  const id = button.dataset.id;
  if (!id) return;

  const empresa = appStore.getState().empresas.find((item) => item.id === id);
  if (!empresa) return;

  openFormModal({
    title: `Editar ${empresa.razaoSocial}`,
    fields: renderEmpresaFields(empresa),
    confirmLabel: 'Salvar alterações',
    onConfirm: async (form) => {
      try {
        setError(null);
        const updated = await empresaService.update(id, readEmpresaForm(form));
        upsertEmpresa(updated);
        showToast('Empresa atualizada com sucesso.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Não foi possível atualizar a empresa.';
        setError(message);
        showToast(message, 'danger');
        throw error;
      }
    },
  });
};

const handleDelete = async (event: Event): Promise<void> => {
  const button = event.currentTarget as HTMLButtonElement;
  const id = button.dataset.id;
  const name = button.dataset.name ?? 'esta empresa';

  if (!id) return;
  if (!window.confirm(`Deseja remover ${name}? Os colaboradores vinculados também serão excluídos.`)) {
    return;
  }

  try {
    setError(null);
    await empresaService.remove(id);
    setEmpresas(appStore.getState().empresas.filter((empresa) => empresa.id !== id));
    showToast('Empresa removida com sucesso.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível remover a empresa.';
    setError(message);
    showToast(message, 'danger');
  }
};

export const loadEmpresas = async (): Promise<void> => {
  setLoadingEmpresas(true);
  try {
    const empresas = await empresaService.list();
    setEmpresas(empresas);
    setError(null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar as empresas.';
    setError(message);
    showToast(message, 'danger');
  } finally {
    setLoadingEmpresas(false);
  }
};

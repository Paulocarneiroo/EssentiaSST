import { colaboradorService } from '../services/colaboradorService.js';
import { empresaService } from '../services/empresaService.js';
import {
  appStore,
  setColaboradores,
  setEmpresas,
  setError,
  setLoadingColaboradores,
  upsertColaborador,
  type AppState,
} from '../state/appState.js';
import type { Colaborador, CreateColaboradorData } from '../types/colaborador.js';
import { openFormModal } from './modal.js';
import { showToast } from './toast.js';

const appRoot = (): HTMLElement => {
  const root = document.getElementById('app');
  if (!root) throw new Error('Elemento #app não encontrado.');
  return root;
};

const empresaLabel = (state: AppState, empresaId: string): string => {
  const empresa = state.empresas.find((item) => item.id === empresaId);
  return empresa ? empresa.nomeFantasia : 'Empresa não encontrada';
};

const renderLoading = (): string => `
  <div class="loading-overlay">
    <div class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></div>
    <span>Carregando colaboradores...</span>
  </div>
`;

const renderTable = (state: AppState): string => {
  if (state.loadingColaboradores) return renderLoading();

  if (state.colaboradores.length === 0) {
    return '<div class="empty-state">Nenhum colaborador cadastrado.</div>';
  }

  const rows = state.colaboradores
    .map(
      (colaborador) => `
        <tr>
          <td>${colaborador.nome}</td>
          <td>${colaboradorService.formatCpf(colaborador.cpf)}</td>
          <td>${empresaLabel(state, colaborador.empresaId)}</td>
          <td>${colaborador.cargo}</td>
          <td>${colaboradorService.formatDate(colaborador.dataAdmissao)}</td>
          <td class="text-end">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary me-2"
              data-action="edit-colaborador"
              data-id="${colaborador.id}"
            >
              Editar
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger btn-delete"
              data-action="delete-colaborador"
              data-id="${colaborador.id}"
              data-name="${colaborador.nome}"
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
            <th>Nome</th>
            <th>CPF</th>
            <th>Empresa</th>
            <th>Cargo</th>
            <th>Admissão</th>
            <th class="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

const renderEmpresaOptions = (state: AppState, selectedId?: string): string => {
  if (state.empresas.length === 0) {
    return '<option value="">Cadastre uma empresa primeiro</option>';
  }

  return [
    '<option value="">Selecione a empresa</option>',
    ...state.empresas.map(
      (empresa) =>
        `<option value="${empresa.id}" ${empresa.id === selectedId ? 'selected' : ''}>${empresa.nomeFantasia}</option>`,
    ),
  ].join('');
};

const renderColaboradorFields = (state: AppState, colaborador?: Colaborador): string => {
  const empresasDisabled = state.empresas.length === 0;
  return `
    <div class="col-md-6">
      <label for="empresaId" class="form-label">Empresa</label>
      <select class="form-select" id="empresaId" name="empresaId" required ${empresasDisabled ? 'disabled' : ''}>
        ${renderEmpresaOptions(state, colaborador?.empresaId)}
      </select>
    </div>
    <div class="col-md-6">
      <label for="cpf" class="form-label">CPF</label>
      <input type="text" class="form-control" id="cpf" name="cpf" placeholder="000.000.000-00" required maxlength="14" value="${colaborador ? colaboradorService.formatCpf(colaborador.cpf) : ''}" />
    </div>
    <div class="col-md-6">
      <label for="nome" class="form-label">Nome completo</label>
      <input type="text" class="form-control" id="nome" name="nome" required value="${colaborador?.nome ?? ''}" />
    </div>
    <div class="col-md-6">
      <label for="cargo" class="form-label">Cargo</label>
      <input type="text" class="form-control" id="cargo" name="cargo" required value="${colaborador?.cargo ?? ''}" />
    </div>
    <div class="col-md-6">
      <label for="dataNascimento" class="form-label">Data de nascimento</label>
      <input type="date" class="form-control" id="dataNascimento" name="dataNascimento" required value="${colaborador ? colaboradorService.toDateInput(colaborador.dataNascimento) : ''}" />
    </div>
    <div class="col-md-6">
      <label for="dataAdmissao" class="form-label">Data de admissão</label>
      <input type="date" class="form-control" id="dataAdmissao" name="dataAdmissao" required value="${colaborador ? colaboradorService.toDateInput(colaborador.dataAdmissao) : ''}" />
    </div>
  `;
};

const readColaboradorForm = (form: HTMLFormElement): CreateColaboradorData => {
  const formData = new FormData(form);
  return {
    empresaId: String(formData.get('empresaId') ?? ''),
    cpf: String(formData.get('cpf') ?? ''),
    nome: String(formData.get('nome') ?? ''),
    dataNascimento: String(formData.get('dataNascimento') ?? ''),
    cargo: String(formData.get('cargo') ?? ''),
    dataAdmissao: String(formData.get('dataAdmissao') ?? ''),
  };
};

const renderForm = (state: AppState): string => `
  <form id="colaborador-form" class="row g-3" novalidate>
    ${renderColaboradorFields(state)}
    <div class="col-12">
      <button type="submit" class="btn btn-primary" ${state.empresas.length === 0 ? 'disabled' : ''}>
        Cadastrar colaborador
      </button>
    </div>
  </form>
`;

export const renderColaboradorView = (state: AppState): void => {
  appRoot().innerHTML = `
    <section>
      <header class="page-header">
        <h1>Colaboradores</h1>
        <p class="text-muted mb-0">Gerencie os colaboradores vinculados às empresas.</p>
      </header>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card card-form">
            <div class="card-body">
              <h2 class="h5 mb-3">Novo colaborador</h2>
              ${renderForm(state)}
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

  bindColaboradorEvents();
};

const bindColaboradorEvents = (): void => {
  const form = document.getElementById('colaborador-form') as HTMLFormElement | null;
  form?.addEventListener('submit', handleCreate);

  document.querySelectorAll('[data-action="edit-colaborador"]').forEach((button) => {
    button.addEventListener('click', handleEdit);
  });

  document.querySelectorAll('[data-action="delete-colaborador"]').forEach((button) => {
    button.addEventListener('click', handleDelete);
  });
};

const handleCreate = async (event: Event): Promise<void> => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;

  try {
    setError(null);
    const created = await colaboradorService.create(readColaboradorForm(form));
    setColaboradores([created, ...appStore.getState().colaboradores]);
    form.reset();
    showToast('Colaborador cadastrado com sucesso.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível cadastrar o colaborador.';
    setError(message);
    showToast(message, 'danger');
  }
};

const handleEdit = (event: Event): void => {
  const button = event.currentTarget as HTMLButtonElement;
  const id = button.dataset.id;
  if (!id) return;

  const state = appStore.getState();
  const colaborador = state.colaboradores.find((item) => item.id === id);
  if (!colaborador) return;

  openFormModal({
    title: `Editar ${colaborador.nome}`,
    fields: renderColaboradorFields(state, colaborador),
    confirmLabel: 'Salvar alterações',
    onConfirm: async (form) => {
      try {
        setError(null);
        const updated = await colaboradorService.update(id, readColaboradorForm(form));
        upsertColaborador(updated);
        showToast('Colaborador atualizado com sucesso.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Não foi possível atualizar o colaborador.';
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
  const name = button.dataset.name ?? 'este colaborador';

  if (!id) return;
  if (!window.confirm(`Deseja remover ${name}?`)) return;

  try {
    setError(null);
    await colaboradorService.remove(id);
    setColaboradores(appStore.getState().colaboradores.filter((item) => item.id !== id));
    showToast('Colaborador removido com sucesso.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível remover o colaborador.';
    setError(message);
    showToast(message, 'danger');
  }
};

export const loadColaboradores = async (): Promise<void> => {
  setLoadingColaboradores(true);
  try {
    const colaboradores = await colaboradorService.list();
    setColaboradores(colaboradores);
    setError(null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar os colaboradores.';
    setError(message);
    showToast(message, 'danger');
  } finally {
    setLoadingColaboradores(false);
  }
};

export const ensureEmpresasLoaded = async (): Promise<void> => {
  if (appStore.getState().empresas.length > 0) return;

  try {
    const empresas = await empresaService.list();
    setEmpresas(empresas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar as empresas.';
    setError(message);
    showToast(message, 'danger');
  }
};

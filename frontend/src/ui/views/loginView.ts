import { DEFAULT_API_BASE_URL, getApiBaseUrl, setApiBaseUrl } from '../../api/config.js';
import { authService } from '../../services/authService.js';
import { LABEL_GRAU_RISCO } from '../../services/labels.js';
import { bindSubmit } from '../forms.js';
import { readNumber, readString, selectField, textField } from '../formFields.js';
import { esc } from '../html.js';
import { navegar } from '../router.js';
import { showToast } from '../toast.js';

const OPCOES_GRAU_RISCO = [1, 2, 3, 4].map((grau) => ({
  value: grau,
  label: LABEL_GRAU_RISCO[grau],
}));

const formularioLogin = (): string => `
  <form id="form-login" class="row g-3" novalidate>
    <div class="alert alert-danger d-none col-12 mb-0" role="alert" data-role="erro"></div>
    ${textField({ name: 'email', label: 'E-mail', type: 'email', col: 12, required: true, placeholder: 'voce@empresa.com.br' })}
    ${textField({ name: 'senha', label: 'Senha', type: 'password', col: 12, required: true })}
    <div class="col-12 d-grid">
      <button type="submit" class="btn btn-primary">Entrar</button>
    </div>
  </form>
`;

const formularioNovaConta = (): string => `
  <form id="form-conta" class="row g-3" novalidate>
    <div class="alert alert-danger d-none col-12 mb-0" role="alert" data-role="erro"></div>

    <div class="col-12">
      <h3 class="form-section-title">Dados da empresa</h3>
    </div>
    ${textField({ name: 'cnpj', label: 'CNPJ', col: 6, required: true, placeholder: '00.000.000/0000-00', maxlength: 18 })}
    ${selectField({ name: 'grauRisco', label: 'Grau de risco (NR-04)', col: 6, options: OPCOES_GRAU_RISCO, required: true })}
    ${textField({ name: 'razaoSocial', label: 'Razão social', col: 12, required: true })}
    ${textField({ name: 'nomeFantasia', label: 'Nome fantasia', col: 6, required: true })}
    ${textField({ name: 'cnae', label: 'CNAE', col: 6, required: true, maxlength: 10, placeholder: '4321500' })}

    <div class="col-12">
      <h3 class="form-section-title">Administrador da conta</h3>
    </div>
    ${textField({ name: 'nome', label: 'Nome completo', col: 12, required: true })}
    ${textField({ name: 'emailAdmin', label: 'E-mail', type: 'email', col: 6, required: true })}
    ${textField({ name: 'senhaAdmin', label: 'Senha', type: 'password', col: 6, required: true, help: 'Mínimo de 6 caracteres.' })}

    <div class="col-12 d-grid">
      <button type="submit" class="btn btn-primary">Criar conta e entrar</button>
    </div>
  </form>
`;

const configuracaoApi = (): string => `
  <div class="api-config">
    <button
      class="btn btn-sm btn-link p-0"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#api-config-body"
      aria-expanded="false"
      aria-controls="api-config-body"
    >
      Endereço da API
    </button>
    <div class="collapse" id="api-config-body">
      <form id="form-api" class="row g-2 mt-1" novalidate>
        <div class="col-12">
          <input
            type="url"
            class="form-control form-control-sm"
            name="apiBaseUrl"
            value="${esc(getApiBaseUrl())}"
            placeholder="${esc(DEFAULT_API_BASE_URL)}"
            required
          />
          <div class="form-text">
            Use o IP da máquina que roda a API quando o back-end estiver em outro computador.
          </div>
        </div>
        <div class="col-12 d-grid">
          <button type="submit" class="btn btn-sm btn-outline-secondary">Salvar endereço</button>
        </div>
      </form>
    </div>
  </div>
`;

export const renderLoginView = (root: HTMLElement): void => {
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <h1>Essentia<span class="brand-accent">SST</span></h1>
          <p>Gestão de Segurança e Saúde no Trabalho integrada ao eSocial.</p>
        </div>

        <ul class="nav nav-pills nav-fill mb-4" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#painel-login" type="button" role="tab">
              Entrar
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="pill" data-bs-target="#painel-conta" type="button" role="tab">
              Primeiro acesso
            </button>
          </li>
        </ul>

        <div class="tab-content">
          <div class="tab-pane fade show active" id="painel-login" role="tabpanel">
            ${formularioLogin()}
          </div>
          <div class="tab-pane fade" id="painel-conta" role="tabpanel">
            <p class="text-muted small">
              Cadastre a empresa e o primeiro administrador. Novos usuários da equipe são
              registrados depois, por um administrador, dentro da plataforma.
            </p>
            ${formularioNovaConta()}
          </div>
        </div>

        ${configuracaoApi()}
      </div>
    </div>
  `;

  const formLogin = root.querySelector('#form-login') as HTMLFormElement;
  bindSubmit(
    formLogin,
    async (form) => {
      await authService.login({
        email: readString(form, 'email'),
        senha: readString(form, 'senha'),
      });
      showToast('Bem-vindo de volta!');
      navegar('/');
    },
    { carregando: 'Entrando...', erroPadrao: 'Não foi possível entrar.', erroInline: true },
  );

  const formConta = root.querySelector('#form-conta') as HTMLFormElement;
  bindSubmit(
    formConta,
    async (form) => {
      await authService.criarConta({
        empresa: {
          cnpj: readString(form, 'cnpj'),
          razaoSocial: readString(form, 'razaoSocial'),
          nomeFantasia: readString(form, 'nomeFantasia'),
          cnae: readString(form, 'cnae'),
          grauRisco: readNumber(form, 'grauRisco'),
        },
        admin: {
          nome: readString(form, 'nome'),
          email: readString(form, 'emailAdmin'),
          senha: readString(form, 'senhaAdmin'),
        },
      });
      showToast('Conta criada com sucesso.');
      navegar('/');
    },
    {
      carregando: 'Criando conta...',
      erroPadrao: 'Não foi possível criar a conta.',
      erroInline: true,
    },
  );

  const formApi = root.querySelector('#form-api') as HTMLFormElement;
  bindSubmit(
    formApi,
    async (form) => {
      setApiBaseUrl(readString(form, 'apiBaseUrl'));
      showToast('Endereço da API atualizado.');
    },
    { carregando: 'Salvando...' },
  );
};

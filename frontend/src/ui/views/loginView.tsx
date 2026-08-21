import { useNavigate } from 'react-router-dom';
import { DEFAULT_API_BASE_URL, getApiBaseUrl, setApiBaseUrl } from '../../api/config';
import { authService } from '../../services/authService';
import { LABEL_GRAU_RISCO } from '../../services/labels';
import { useDocumentTitle } from '../components';
import { FieldsetTitle, readNumber, readString, SelectField, TextField } from '../formFields';
import { useFormSubmit } from '../forms';
import { showToast } from '../toast';

const OPCOES_GRAU_RISCO = [1, 2, 3, 4].map((grau) => ({
  value: grau,
  label: LABEL_GRAU_RISCO[grau],
}));

const FormularioLogin = () => {
  const navigate = useNavigate();
  const { onSubmit, busy, erro, carregando } = useFormSubmit(
    async (form) => {
      await authService.login({
        email: readString(form, 'email'),
        senha: readString(form, 'senha'),
      });
      showToast('Bem-vindo de volta!');
      void navigate('/');
    },
    { carregando: 'Entrando...', erroPadrao: 'Não foi possível entrar.', erroInline: true },
  );

  return (
    <form className="row g-3" noValidate onSubmit={(event) => void onSubmit(event)}>
      <div className={`alert alert-danger col-12 mb-0${erro ? '' : ' d-none'}`} role="alert">
        {erro}
      </div>
      <TextField
        name="email"
        label="E-mail"
        type="email"
        col={12}
        required
        placeholder="voce@empresa.com.br"
      />
      <TextField name="senha" label="Senha" type="password" col={12} required />
      <div className="col-12 d-grid">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {carregando}
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </div>
    </form>
  );
};

const FormularioNovaConta = () => {
  const navigate = useNavigate();
  const { onSubmit, busy, erro, carregando } = useFormSubmit(
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
      void navigate('/');
    },
    {
      carregando: 'Criando conta...',
      erroPadrao: 'Não foi possível criar a conta.',
      erroInline: true,
    },
  );

  return (
    <form className="row g-3" noValidate onSubmit={(event) => void onSubmit(event)}>
      <div className={`alert alert-danger col-12 mb-0${erro ? '' : ' d-none'}`} role="alert">
        {erro}
      </div>
      <FieldsetTitle titulo="Dados da empresa" />
      <TextField
        name="cnpj"
        label="CNPJ"
        col={6}
        required
        placeholder="00.000.000/0000-00"
        maxlength={18}
      />
      <SelectField
        name="grauRisco"
        label="Grau de risco (NR-04)"
        col={6}
        options={OPCOES_GRAU_RISCO}
        required
      />
      <TextField name="razaoSocial" label="Razão social" col={12} required />
      <TextField name="nomeFantasia" label="Nome fantasia" col={6} required />
      <TextField name="cnae" label="CNAE" col={6} required maxlength={10} placeholder="4321500" />
      <FieldsetTitle titulo="Administrador da conta" />
      <TextField name="nome" label="Nome completo" col={12} required />
      <TextField name="emailAdmin" label="E-mail" type="email" col={6} required />
      <TextField
        name="senhaAdmin"
        label="Senha"
        type="password"
        col={6}
        required
        help="Mínimo de 6 caracteres."
      />
      <div className="col-12 d-grid">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {carregando}
            </>
          ) : (
            'Criar conta e entrar'
          )}
        </button>
      </div>
    </form>
  );
};

const ConfiguracaoApi = () => {
  const { onSubmit, busy, carregando } = useFormSubmit(
    async (form) => {
      setApiBaseUrl(readString(form, 'apiBaseUrl'));
      showToast('Endereço da API atualizado.');
    },
    { carregando: 'Salvando...' },
  );

  return (
    <div className="api-config">
      <button
        className="btn btn-sm btn-link p-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#api-config-body"
        aria-expanded="false"
        aria-controls="api-config-body"
      >
        Endereço da API
      </button>
      <div className="collapse" id="api-config-body">
        <form className="row g-2 mt-1" noValidate onSubmit={(event) => void onSubmit(event)}>
          <div className="col-12">
            <input
              type="url"
              className="form-control form-control-sm"
              name="apiBaseUrl"
              defaultValue={getApiBaseUrl()}
              placeholder={DEFAULT_API_BASE_URL}
              required
            />
            <div className="form-text">
              Use o IP da máquina que roda a API quando o back-end estiver em outro computador.
            </div>
          </div>
          <div className="col-12 d-grid">
            <button type="submit" className="btn btn-sm btn-outline-secondary" disabled={busy}>
              {busy ? carregando : 'Salvar endereço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LoginPage = () => {
  useDocumentTitle('Entrar');

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>
            Essentia<span className="brand-accent">SST</span>
          </h1>
          <p>Gestão de Segurança e Saúde no Trabalho integrada ao eSocial.</p>
        </div>

        <ul className="nav nav-pills nav-fill mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active"
              data-bs-toggle="pill"
              data-bs-target="#painel-login"
              type="button"
              role="tab"
            >
              Entrar
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              data-bs-toggle="pill"
              data-bs-target="#painel-conta"
              type="button"
              role="tab"
            >
              Primeiro acesso
            </button>
          </li>
        </ul>

        <div className="tab-content">
          <div className="tab-pane fade show active" id="painel-login" role="tabpanel">
            <FormularioLogin />
          </div>
          <div className="tab-pane fade" id="painel-conta" role="tabpanel">
            <p className="text-muted small">
              Cadastre a empresa e o primeiro administrador. Novos usuários da equipe são registrados
              depois, por um administrador, dentro da plataforma.
            </p>
            <FormularioNovaConta />
          </div>
        </div>

        <ConfiguracaoApi />
      </div>
    </div>
  );
};

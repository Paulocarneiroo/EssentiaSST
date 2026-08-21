import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { LABEL_PAPEL } from '../services/labels';
import { useSession } from '../state/useSession';

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

export const AppNavbar = () => {
  const { sessao, isAdmin } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const usuario = sessao?.usuario;

  if (!usuario) return null;

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark app-navbar shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-semibold" to="/">
            Essentia<span className="brand-accent">SST</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Alternar navegação"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              {NAV.map((item) => (
                <li className="nav-item" key={item.caminho}>
                  <Link
                    className={`nav-link${ativo(item.caminho, pathname) ? ' active' : ''}`}
                    to={item.caminho}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="dropdown">
              <button
                className="btn btn-sm btn-user dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span className="avatar" aria-hidden="true">
                  {usuario.nome.trim().charAt(0).toUpperCase()}
                </span>
                <span className="d-none d-md-inline">{usuario.nome}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li className="dropdown-header">
                  <span className="d-block fw-semibold">{usuario.email}</span>
                  <span className="text-muted">{LABEL_PAPEL[usuario.papel]}</span>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                {NAV_CONTA.filter((item) => !item.somenteAdmin || isAdmin).map((item) => (
                  <li key={item.caminho}>
                    <Link className="dropdown-item" to={item.caminho}>
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    type="button"
                    onClick={() => {
                      authService.logout();
                      void navigate('/login');
                    }}
                  >
                    Sair
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

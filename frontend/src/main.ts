import { setSessionExpiredHandler } from './api/client.js';
import { authService } from './services/authService.js';
import { isAutenticado } from './state/session.js';
import { iniciarLayout, renderLayout } from './ui/layout.js';
import { aoMudarRota, iniciarRouter, navegar, type Rota } from './ui/router.js';
import { showToast } from './ui/toast.js';
import { renderAcidenteView } from './ui/views/acidenteView.js';
import { renderAsoView } from './ui/views/asoView.js';
import { renderColaboradorDetalheView } from './ui/views/colaboradorDetalheView.js';
import { renderColaboradorView } from './ui/views/colaboradorView.js';
import { renderDashboardView } from './ui/views/dashboardView.js';
import { renderEmpresaView } from './ui/views/empresaView.js';
import { renderESocialView } from './ui/views/esocialView.js';
import { renderLoginView } from './ui/views/loginView.js';
import { renderPgrView } from './ui/views/pgrView.js';
import { renderRiscoView } from './ui/views/riscoView.js';
import { renderUsuarioView } from './ui/views/usuarioView.js';

const rotas: Rota[] = [
  { path: '/login', titulo: 'Entrar', publica: true, render: renderLoginView },
  { path: '/', titulo: 'Painel', render: renderDashboardView },
  { path: '/colaboradores', titulo: 'Colaboradores', render: renderColaboradorView },
  { path: '/colaboradores/:id', titulo: 'Colaborador', render: renderColaboradorDetalheView },
  { path: '/asos', titulo: 'ASOs', render: renderAsoView },
  { path: '/riscos', titulo: 'Riscos', render: renderRiscoView },
  { path: '/acidentes', titulo: 'Acidentes', render: renderAcidenteView },
  { path: '/esocial', titulo: 'eSocial', render: renderESocialView },
  { path: '/pgr', titulo: 'Relatório PGR', render: renderPgrView },
  { path: '/empresa', titulo: 'Empresa', render: renderEmpresaView },
  { path: '/usuarios', titulo: 'Usuários', somenteAdmin: true, render: renderUsuarioView },
];

const bootstrapApp = (): void => {
  // Token recusado pela API: a sessão cai e o usuário volta ao login (H2.3).
  setSessionExpiredHandler(() => {
    showToast('Sua sessão expirou. Entre novamente.', 'warning');
    navegar('/login');
  });

  aoMudarRota(() => renderLayout());
  iniciarLayout();
  iniciarRouter(rotas);

  // Revalida o token guardado no navegador contra a API, sem bloquear a primeira pintura.
  if (isAutenticado()) {
    void authService.revalidar().catch(() => undefined);
  }
};

bootstrapApp();

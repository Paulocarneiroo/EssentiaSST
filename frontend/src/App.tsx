import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { setSessionExpiredHandler } from './api/client';
import { authService } from './services/authService';
import { isAutenticado } from './state/session';
import { useSession } from './state/useSession';
import {
  AlertBox,
  PageHeader,
  useDocumentTitle,
} from './ui/components';
import { AppNavbar } from './ui/layout';
import { ModalHost } from './ui/modal';
import { showToast, ToastHost } from './ui/toast';
import { AcidentePage } from './ui/views/acidenteView';
import { AsoPage } from './ui/views/asoView';
import { ColaboradorDetalhePage } from './ui/views/colaboradorDetalheView';
import { ColaboradorPage } from './ui/views/colaboradorView';
import { DashboardPage } from './ui/views/dashboardView';
import { EmpresaPage } from './ui/views/empresaView';
import { ESocialPage } from './ui/views/esocialView';
import { LoginPage } from './ui/views/loginView';
import { PgrPage } from './ui/views/pgrView';
import { RiscoPage } from './ui/views/riscoView';
import { UsuarioPage } from './ui/views/usuarioView';

const NaoEncontradaPage = () => {
  useDocumentTitle('Página não encontrada');
  return (
    <>
      <PageHeader titulo="Página não encontrada" subtitulo="O endereço acessado não existe." />
      <a className="btn btn-primary" href="#/">
        Ir para o painel
      </a>
    </>
  );
};

const CatchAllPage = () => {
  const { isAutenticado: autenticado } = useSession();
  if (!autenticado) return <Navigate to="/login" replace />;
  return <NaoEncontradaPage />;
};

const AcessoRestritoPage = () => (
  <>
    <PageHeader
      titulo="Acesso restrito"
      subtitulo="Esta área é exclusiva de administradores."
    />
    <AlertBox
      mensagem="Seu perfil de operador não permite acessar esta tela. Fale com um administrador da empresa."
      variant="warning"
    />
  </>
);

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAutenticado: autenticado } = useSession();
  if (autenticado) return <Navigate to="/" replace />;
  return children;
};

const ProtectedRoute = () => {
  const { isAutenticado: autenticado } = useSession();
  if (!autenticado) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useSession();
  if (!isAdmin) return <AcessoRestritoPage />;
  return children;
};

const SessionExpiredBridge = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      showToast('Sua sessão expirou. Entre novamente.', 'warning');
      void navigate('/login');
    });
  }, [navigate]);

  useEffect(() => {
    if (isAutenticado()) {
      void authService.revalidar().catch(() => undefined);
    }
  }, []);

  return null;
};

export const App = () => (
  <HashRouter>
    <SessionExpiredBridge />
    <AppNavbar />
    <main className="container py-4">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/colaboradores" element={<ColaboradorPage />} />
          <Route path="/colaboradores/:id" element={<ColaboradorDetalhePage />} />
          <Route path="/asos" element={<AsoPage />} />
          <Route path="/riscos" element={<RiscoPage />} />
          <Route path="/acidentes" element={<AcidentePage />} />
          <Route path="/esocial" element={<ESocialPage />} />
          <Route path="/pgr" element={<PgrPage />} />
          <Route path="/empresa" element={<EmpresaPage />} />
          <Route
            path="/usuarios"
            element={
              <AdminRoute>
                <UsuarioPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<CatchAllPage />} />
      </Routes>
    </main>
    <ToastHost />
    <ModalHost />
  </HashRouter>
);

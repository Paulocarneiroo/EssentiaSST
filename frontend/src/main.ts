import { appStore, type Route } from './state/appState.js';
import {
  ensureEmpresasLoaded,
  loadColaboradores,
  renderColaboradorView,
} from './ui/colaboradorView.js';
import { loadEmpresas, renderEmpresaView } from './ui/empresaView.js';
import { initRouter } from './ui/router.js';

const renderCurrentView = (route: Route): void => {
  const state = appStore.getState();

  if (route === 'empresas') {
    renderEmpresaView(state);
    return;
  }

  renderColaboradorView(state);
};

const loadRouteData = async (route: Route): Promise<void> => {
  if (route === 'empresas') {
    await loadEmpresas();
    return;
  }

  await Promise.all([ensureEmpresasLoaded(), loadColaboradores()]);
};

const bootstrap = (): void => {
  appStore.subscribe((state) => {
    renderCurrentView(state.route);
  });

  initRouter((route) => {
    void loadRouteData(route);
  });
};

bootstrap();

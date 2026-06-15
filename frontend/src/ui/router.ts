import { setRoute, type Route } from '../state/appState.js';

const routes: Route[] = ['empresas', 'colaboradores'];

const parseRoute = (hash: string): Route => {
  const path = hash.replace(/^#\/?/, '').split('/')[0];
  return routes.includes(path as Route) ? (path as Route) : 'empresas';
};

export const initRouter = (onRouteChange: (route: Route) => void): void => {
  const handleHashChange = (): void => {
    const route = parseRoute(window.location.hash);
    setRoute(route);
    onRouteChange(route);
    updateActiveNav(route);
  };

  window.addEventListener('hashchange', handleHashChange);

  if (!window.location.hash || window.location.hash === '#/') {
    window.location.hash = '#/empresas';
  } else {
    handleHashChange();
  }
};

const updateActiveNav = (route: Route): void => {
  document.querySelectorAll('[data-route]').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('data-route') === route);
  });
};

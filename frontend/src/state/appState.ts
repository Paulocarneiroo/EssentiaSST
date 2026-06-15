import { createStore } from './store.js';
import type { Colaborador } from '../types/colaborador.js';
import type { Empresa } from '../types/empresa.js';

export type Route = 'empresas' | 'colaboradores';

export interface AppState {
  route: Route;
  empresas: Empresa[];
  colaboradores: Colaborador[];
  loadingEmpresas: boolean;
  loadingColaboradores: boolean;
  error: string | null;
}

const initialState: AppState = {
  route: 'empresas',
  empresas: [],
  colaboradores: [],
  loadingEmpresas: false,
  loadingColaboradores: false,
  error: null,
};

export const appStore = createStore<AppState>(initialState);

export const setRoute = (route: Route): void => {
  appStore.setState({ route, error: null });
};

export const setEmpresas = (empresas: Empresa[]): void => {
  appStore.setState({ empresas });
};

export const setColaboradores = (colaboradores: Colaborador[]): void => {
  appStore.setState({ colaboradores });
};

export const upsertEmpresa = (empresa: Empresa): void => {
  const empresas = appStore.getState().empresas.map((item) => (item.id === empresa.id ? empresa : item));
  appStore.setState({ empresas });
};

export const upsertColaborador = (colaborador: Colaborador): void => {
  const colaboradores = appStore
    .getState()
    .colaboradores.map((item) => (item.id === colaborador.id ? colaborador : item));
  appStore.setState({ colaboradores });
};

export const setLoadingEmpresas = (loadingEmpresas: boolean): void => {
  appStore.setState({ loadingEmpresas });
};

export const setLoadingColaboradores = (loadingColaboradores: boolean): void => {
  appStore.setState({ loadingColaboradores });
};

export const setError = (error: string | null): void => {
  appStore.setState({ error });
};

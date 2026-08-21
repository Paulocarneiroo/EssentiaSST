import { useEffect, useState } from 'react';
import { sessionStore, type SessionState } from './session';

/** Espelha o `sessionStore` no ciclo de vida do React. */
export const useSession = (): SessionState & { isAutenticado: boolean; isAdmin: boolean } => {
  const [state, setState] = useState<SessionState>(sessionStore.getState());

  useEffect(() => sessionStore.subscribe(setState), []);

  return {
    ...state,
    isAutenticado: state.sessao !== null,
    isAdmin: state.sessao?.usuario.papel === 'ADMIN',
  };
};

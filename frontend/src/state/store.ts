export type Listener<T> = (state: T) => void;

export interface Store<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: Listener<T>): () => void;
}

export const createStore = <T extends object>(initialState: T): Store<T> => {
  let state = { ...initialState };
  const listeners = new Set<Listener<T>>();

  return {
    getState() {
      return state;
    },

    setState(partial) {
      state = { ...state, ...partial };
      listeners.forEach((listener) => listener(state));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

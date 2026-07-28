declare const bootstrap: {
  Toast: new (
    element: Element,
    options?: {
      delay?: number;
      autohide?: boolean;
    },
  ) => {
    show(): void;
    hide(): void;
  };
  Modal: new (
    element: Element,
    options?: {
      backdrop?: boolean | 'static';
      keyboard?: boolean;
    },
  ) => {
    show(): void;
    hide(): void;
  };
  Dropdown: new (element: Element) => {
    show(): void;
    hide(): void;
  };
};

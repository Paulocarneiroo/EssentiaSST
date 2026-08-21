import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Modal as BsModal } from 'bootstrap';

type Tamanho = 'sm' | 'md' | 'lg' | 'xl';

const classeTamanho = (tamanho: Tamanho): string => (tamanho === 'md' ? '' : `modal-${tamanho}`);

export interface FormModalOptions {
  titulo: string;
  campos: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tamanho?: Tamanho;
  /** Lança para manter o modal aberto exibindo a mensagem do erro. */
  onConfirm: (form: HTMLFormElement) => Promise<void>;
}

export interface ConfirmOptions {
  titulo: string;
  mensagem: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
}

export interface InfoModalOptions {
  titulo: string;
  corpo: ReactNode;
  tamanho?: Tamanho;
  acoes?: ReactNode;
}

type ModalPedido =
  | { tipo: 'form'; opcoes: FormModalOptions }
  | { tipo: 'confirm'; opcoes: ConfirmOptions; resolver: (valor: boolean) => void }
  | { tipo: 'info'; opcoes: InfoModalOptions };

let abrir: ((pedido: ModalPedido) => void) | null = null;

export const openFormModal = (opcoes: FormModalOptions): void => {
  abrir?.({ tipo: 'form', opcoes });
};

export const openConfirm = (opcoes: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    if (!abrir) {
      resolve(false);
      return;
    }
    abrir({ tipo: 'confirm', opcoes, resolver: resolve });
  });

export const openInfoModal = (opcoes: InfoModalOptions): void => {
  abrir?.({ tipo: 'info', opcoes });
};

const useBootstrapModal = (aoOcultar: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  const instancia = useRef<BsModal | null>(null);
  const aoOcultarRef = useRef(aoOcultar);
  aoOcultarRef.current = aoOcultar;

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    let encerrado = false;
    const modal = new BsModal(elemento);
    instancia.current = modal;
    const handler = () => {
      if (!encerrado) aoOcultarRef.current();
    };
    elemento.addEventListener('hidden.bs.modal', handler);
    modal.show();

    return () => {
      encerrado = true;
      elemento.removeEventListener('hidden.bs.modal', handler);
      modal.dispose();
      instancia.current = null;
    };
  }, []);

  return { ref, hide: () => instancia.current?.hide() };
};

const FormModalView = ({
  opcoes,
  onClose,
}: {
  opcoes: FormModalOptions;
  onClose: () => void;
}) => {
  const { ref, hide } = useBootstrapModal(onClose);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const {
    titulo,
    campos,
    confirmLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    tamanho = 'lg',
    onConfirm,
  } = opcoes;

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    setErro(null);
    setBusy(true);

    try {
      await onConfirm(form);
      hide();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir a operação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="modal fade" tabIndex={-1} aria-hidden="true">
      <div
        className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${classeTamanho(tamanho)}`}
      >
        <div className="modal-content">
          <form noValidate onSubmit={(event) => void onSubmit(event)}>
            <div className="modal-header">
              <h2 className="modal-title h5">{titulo}</h2>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Fechar" />
            </div>
            <div className="modal-body">
              <div className={`alert alert-danger${erro ? '' : ' d-none'}`} role="alert">
                {erro}
              </div>
              <div className="row g-3">{campos}</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                {cancelLabel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Salvando...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ConfirmModalView = ({
  opcoes,
  resolver,
  onClose,
}: {
  opcoes: ConfirmOptions;
  resolver: (valor: boolean) => void;
  onClose: () => void;
}) => {
  const confirmado = useRef(false);
  const { ref, hide } = useBootstrapModal(() => {
    resolver(confirmado.current);
    onClose();
  });
  const {
    titulo,
    mensagem,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
  } = opcoes;

  return (
    <div ref={ref} className="modal fade" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5">{titulo}</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Fechar" />
          </div>
          <div className="modal-body">
            <p className="mb-0">{mensagem}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn btn-${variant}`}
              onClick={() => {
                confirmado.current = true;
                hide();
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoModalView = ({
  opcoes,
  onClose,
}: {
  opcoes: InfoModalOptions;
  onClose: () => void;
}) => {
  const { ref } = useBootstrapModal(onClose);
  const { titulo, corpo, tamanho = 'lg', acoes } = opcoes;

  return (
    <div ref={ref} className="modal fade" tabIndex={-1} aria-hidden="true">
      <div
        className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${classeTamanho(tamanho)}`}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5">{titulo}</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Fechar" />
          </div>
          <div className="modal-body">{corpo}</div>
          <div className="modal-footer">
            {acoes}
            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalHost = () => {
  const [pedido, setPedido] = useState<ModalPedido | null>(null);

  useEffect(() => {
    abrir = setPedido;
    return () => {
      abrir = null;
    };
  }, []);

  if (!pedido) return <div id="modal-container" />;

  const fechar = () => setPedido(null);

  return (
    <div id="modal-container">
      {pedido.tipo === 'form' ? (
        <FormModalView opcoes={pedido.opcoes} onClose={fechar} />
      ) : null}
      {pedido.tipo === 'confirm' ? (
        <ConfirmModalView opcoes={pedido.opcoes} resolver={pedido.resolver} onClose={fechar} />
      ) : null}
      {pedido.tipo === 'info' ? (
        <InfoModalView opcoes={pedido.opcoes} onClose={fechar} />
      ) : null}
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import { Toast as BsToast } from 'bootstrap';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

interface ToastItem {
  id: string;
  mensagem: string;
  variant: ToastVariant;
}

let emitir: ((item: Omit<ToastItem, 'id'>) => void) | null = null;
let contador = 0;

export const showToast = (mensagem: string, variant: ToastVariant = 'success'): void => {
  emitir?.({ mensagem, variant });
};

export const toastErro = (error: unknown, fallback: string): void => {
  showToast(error instanceof Error ? error.message : fallback, 'danger');
};

const ToastView = ({
  item,
  onHidden,
}: {
  item: ToastItem;
  onHidden: (id: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const toast = new BsToast(elemento, { delay: item.variant === 'danger' ? 6000 : 4000 });
    const aoOcultar = () => onHidden(item.id);
    elemento.addEventListener('hidden.bs.toast', aoOcultar);
    toast.show();

    return () => {
      elemento.removeEventListener('hidden.bs.toast', aoOcultar);
      toast.dispose();
    };
  }, [item.id, item.variant, onHidden]);

  const fecharEscuro = item.variant === 'warning' ? '' : 'btn-close-white';

  return (
    <div
      ref={ref}
      className={`toast align-items-center text-bg-${item.variant} border-0`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="d-flex">
        <div className="toast-body">{item.mensagem}</div>
        <button
          type="button"
          className={`btn-close ${fecharEscuro} me-2 m-auto`}
          data-bs-dismiss="toast"
          aria-label="Fechar"
        />
      </div>
    </div>
  );
};

export const ToastHost = () => {
  const [itens, setItens] = useState<ToastItem[]>([]);

  useEffect(() => {
    emitir = ({ mensagem, variant }) => {
      setItens((atuais) => [
        ...atuais,
        { id: `toast-${++contador}-${Date.now()}`, mensagem, variant },
      ]);
    };
    return () => {
      emitir = null;
    };
  }, []);

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3">
      {itens.map((item) => (
        <ToastView
          key={item.id}
          item={item}
          onHidden={(id) => setItens((atuais) => atuais.filter((toast) => toast.id !== id))}
        />
      ))}
    </div>
  );
};

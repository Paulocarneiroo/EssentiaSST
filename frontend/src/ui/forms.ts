import { useState, type FormEvent } from 'react';
import { toastErro } from './toast';

export interface SubmitOptions {
  /** Texto exibido no botão enquanto a requisição está em curso. */
  carregando?: string;
  /** Mensagem do toast quando o erro não traz uma própria. */
  erroPadrao?: string;
  /** Exibe o erro em um alerta dentro do formulário, além do toast. */
  erroInline?: boolean;
}

/**
 * Liga o submit de um formulário a um handler assíncrono, cuidando de estado do
 * botão, validação nativa do HTML e exibição de erro.
 */
export const useFormSubmit = (
  handler: (form: HTMLFormElement) => Promise<void>,
  {
    carregando = 'Salvando...',
    erroPadrao = 'Não foi possível concluir a operação.',
    erroInline = false,
  }: SubmitOptions = {},
) => {
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    setErro(null);
    setBusy(true);

    try {
      await handler(form);
    } catch (error) {
      if (erroInline) {
        setErro(error instanceof Error ? error.message : erroPadrao);
      } else {
        toastErro(error, erroPadrao);
      }
    } finally {
      setBusy(false);
    }
  };

  return { onSubmit, busy, erro, carregando };
};

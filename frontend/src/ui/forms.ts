import { toastErro } from './toast.js';

export interface SubmitOptions {
  /** Texto exibido no botão enquanto a requisição está em curso. */
  carregando?: string;
  /** Mensagem do toast quando o erro não traz uma própria. */
  erroPadrao?: string;
  /** Exibe o erro em `[data-role="erro"]` dentro do formulário, além do toast. */
  erroInline?: boolean;
}

/**
 * Liga o submit de um formulário a um handler assíncrono, cuidando de estado do
 * botão, validação nativa do HTML e exibição de erro.
 */
export const bindSubmit = (
  form: HTMLFormElement,
  handler: (form: HTMLFormElement) => Promise<void>,
  { carregando = 'Salvando...', erroPadrao = 'Não foi possível concluir a operação.', erroInline = false }: SubmitOptions = {},
): void => {
  const botao = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  const alerta = form.querySelector('[data-role="erro"]') as HTMLElement | null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    alerta?.classList.add('d-none');

    const rotulo = botao?.innerHTML ?? '';
    if (botao) {
      botao.disabled = true;
      botao.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${carregando}`;
    }

    try {
      await handler(form);
    } catch (error) {
      if (erroInline && alerta) {
        alerta.textContent = error instanceof Error ? error.message : erroPadrao;
        alerta.classList.remove('d-none');
      } else {
        toastErro(error, erroPadrao);
      }
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.innerHTML = rotulo;
      }
    }
  });
};

/** Registra um handler de clique para cada elemento com o `data-action` informado. */
export const bindAction = (
  raiz: ParentNode,
  acao: string,
  handler: (elemento: HTMLElement, event: Event) => void,
): void => {
  raiz.querySelectorAll<HTMLElement>(`[data-action="${acao}"]`).forEach((elemento) => {
    elemento.addEventListener('click', (event) => handler(elemento, event));
  });
};

import { esc } from './html.js';

interface CampoBase {
  name: string;
  label: string;
  /** Largura em colunas do grid do Bootstrap (12 = linha inteira). */
  col?: number;
  required?: boolean;
  help?: string;
  disabled?: boolean;
}

export interface CampoTexto extends CampoBase {
  value?: string | number | null;
  type?: 'text' | 'email' | 'password' | 'date' | 'time' | 'number';
  placeholder?: string;
  maxlength?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface Opcao {
  value: string | number;
  label: string;
}

export interface CampoSelect extends CampoBase {
  options: Opcao[];
  value?: string | number | null;
  placeholder?: string;
}

export interface CampoTextarea extends CampoBase {
  value?: string | null;
  rows?: number;
  maxlength?: number;
}

export interface CampoCheck {
  name: string;
  label: string;
  checked?: boolean;
  col?: number;
  help?: string;
}

const wrapper = (col: number, conteudo: string): string =>
  `<div class="col-md-${col}">${conteudo}</div>`;

const helpText = (name: string, help?: string): string =>
  help ? `<div id="${esc(name)}-help" class="form-text">${esc(help)}</div>` : '';

const atributo = (nome: string, valor: number | undefined): string =>
  valor === undefined ? '' : `${nome}="${valor}"`;

export const textField = ({
  name,
  label,
  col = 6,
  value,
  type = 'text',
  required = false,
  placeholder,
  maxlength,
  min,
  max,
  step,
  help,
  disabled = false,
}: CampoTexto): string =>
  wrapper(
    col,
    `
      <label for="${esc(name)}" class="form-label">${esc(label)}${required ? ' <span class="required-mark">*</span>' : ''}</label>
      <input
        type="${type}"
        class="form-control"
        id="${esc(name)}"
        name="${esc(name)}"
        value="${esc(value ?? '')}"
        ${placeholder ? `placeholder="${esc(placeholder)}"` : ''}
        ${atributo('maxlength', maxlength)}
        ${atributo('min', min)}
        ${atributo('max', max)}
        ${atributo('step', step)}
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
        ${help ? `aria-describedby="${esc(name)}-help"` : ''}
      />
      ${helpText(name, help)}
    `,
  );

export const selectField = ({
  name,
  label,
  options,
  col = 6,
  value,
  required = false,
  placeholder = 'Selecione',
  help,
  disabled = false,
}: CampoSelect): string => {
  const opcoes = [
    `<option value="">${esc(placeholder)}</option>`,
    ...options.map(
      (opcao) =>
        `<option value="${esc(opcao.value)}" ${String(opcao.value) === String(value ?? '') ? 'selected' : ''}>${esc(opcao.label)}</option>`,
    ),
  ].join('');

  return wrapper(
    col,
    `
      <label for="${esc(name)}" class="form-label">${esc(label)}${required ? ' <span class="required-mark">*</span>' : ''}</label>
      <select
        class="form-select"
        id="${esc(name)}"
        name="${esc(name)}"
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
        ${help ? `aria-describedby="${esc(name)}-help"` : ''}
      >${opcoes}</select>
      ${helpText(name, help)}
    `,
  );
};

export const textareaField = ({
  name,
  label,
  col = 12,
  value,
  rows = 3,
  required = false,
  maxlength,
  help,
}: CampoTextarea): string =>
  wrapper(
    col,
    `
      <label for="${esc(name)}" class="form-label">${esc(label)}${required ? ' <span class="required-mark">*</span>' : ''}</label>
      <textarea
        class="form-control"
        id="${esc(name)}"
        name="${esc(name)}"
        rows="${rows}"
        ${atributo('maxlength', maxlength)}
        ${required ? 'required' : ''}
        ${help ? `aria-describedby="${esc(name)}-help"` : ''}
      >${esc(value ?? '')}</textarea>
      ${helpText(name, help)}
    `,
  );

export const checkField = ({ name, label, checked = false, col = 6, help }: CampoCheck): string =>
  wrapper(
    col,
    `
      <div class="form-check mt-md-4">
        <input class="form-check-input" type="checkbox" value="true" id="${esc(name)}" name="${esc(name)}" ${checked ? 'checked' : ''} />
        <label class="form-check-label" for="${esc(name)}">${esc(label)}</label>
        ${helpText(name, help)}
      </div>
    `,
  );

/** Título de seção dentro de um formulário longo (CAT). */
export const fieldsetTitle = (titulo: string): string =>
  `<div class="col-12"><h3 class="form-section-title">${esc(titulo)}</h3></div>`;

export const readString = (form: HTMLFormElement, campo: string): string =>
  String(new FormData(form).get(campo) ?? '').trim();

export const readNumber = (form: HTMLFormElement, campo: string): number =>
  Number(new FormData(form).get(campo) ?? 0);

export const readBoolean = (form: HTMLFormElement, campo: string): boolean =>
  new FormData(form).get(campo) === 'true';

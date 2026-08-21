import type { ReactNode } from 'react';

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

const HelpText = ({ name, help }: { name: string; help?: string }) =>
  help ? (
    <div id={`${name}-help`} className="form-text">
      {help}
    </div>
  ) : null;

const Wrapper = ({ col, children }: { col: number; children: ReactNode }) => (
  <div className={`col-md-${col}`}>{children}</div>
);

const Rotulo = ({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) => (
  <label htmlFor={name} className="form-label">
    {label}
    {required ? (
      <>
        {' '}
        <span className="required-mark">*</span>
      </>
    ) : null}
  </label>
);

export const TextField = ({
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
}: CampoTexto) => (
  <Wrapper col={col}>
    <Rotulo name={name} label={label} required={required} />
    <input
      type={type}
      className="form-control"
      id={name}
      name={name}
      defaultValue={value ?? ''}
      placeholder={placeholder}
      maxLength={maxlength}
      min={min}
      max={max}
      step={step}
      required={required}
      disabled={disabled}
      aria-describedby={help ? `${name}-help` : undefined}
    />
    <HelpText name={name} help={help} />
  </Wrapper>
);

export const SelectField = ({
  name,
  label,
  options,
  col = 6,
  value,
  required = false,
  placeholder = 'Selecione',
  help,
  disabled = false,
}: CampoSelect) => (
  <Wrapper col={col}>
    <Rotulo name={name} label={label} required={required} />
    <select
      className="form-select"
      id={name}
      name={name}
      defaultValue={value === null || value === undefined ? '' : String(value)}
      required={required}
      disabled={disabled}
      aria-describedby={help ? `${name}-help` : undefined}
    >
      <option value="">{placeholder}</option>
      {options.map((opcao) => (
        <option key={String(opcao.value)} value={String(opcao.value)}>
          {opcao.label}
        </option>
      ))}
    </select>
    <HelpText name={name} help={help} />
  </Wrapper>
);

export const TextareaField = ({
  name,
  label,
  col = 12,
  value,
  rows = 3,
  required = false,
  maxlength,
  help,
}: CampoTextarea) => (
  <Wrapper col={col}>
    <Rotulo name={name} label={label} required={required} />
    <textarea
      className="form-control"
      id={name}
      name={name}
      rows={rows}
      defaultValue={value ?? ''}
      maxLength={maxlength}
      required={required}
      aria-describedby={help ? `${name}-help` : undefined}
    />
    <HelpText name={name} help={help} />
  </Wrapper>
);

export const CheckField = ({ name, label, checked = false, col = 6, help }: CampoCheck) => (
  <Wrapper col={col}>
    <div className="form-check mt-md-4">
      <input
        className="form-check-input"
        type="checkbox"
        value="true"
        id={name}
        name={name}
        defaultChecked={checked}
      />
      <label className="form-check-label" htmlFor={name}>
        {label}
      </label>
      <HelpText name={name} help={help} />
    </div>
  </Wrapper>
);

/** Título de seção dentro de um formulário longo (CAT). */
export const FieldsetTitle = ({ titulo }: { titulo: string }) => (
  <div className="col-12">
    <h3 className="form-section-title">{titulo}</h3>
  </div>
);

export const readString = (form: HTMLFormElement, campo: string): string =>
  String(new FormData(form).get(campo) ?? '').trim();

export const readNumber = (form: HTMLFormElement, campo: string): number =>
  Number(new FormData(form).get(campo) ?? 0);

export const readBoolean = (form: HTMLFormElement, campo: string): boolean =>
  new FormData(form).get(campo) === 'true';

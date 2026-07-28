export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export const formatCpf = (cpf: string): string => {
  const digits = onlyDigits(cpf).padStart(11, '0').slice(0, 11);
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

export const formatCnpj = (cnpj: string): string => {
  const digits = onlyDigits(cnpj).padStart(14, '0').slice(0, 14);
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

/** `2026-07-26T00:00:00.000Z` → `26/07/2026`. Datas do backend são UTC puro. */
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  const [year, month, day] = date.slice(0, 10).split('-');
  return day && month && year ? `${day}/${month}/${year}` : '—';
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

/** Valor pronto para `<input type="date">`. */
export const toDateInput = (date: string | null | undefined): string =>
  date ? date.slice(0, 10) : '';

export const hojeInput = (): string => new Date().toISOString().slice(0, 10);

/** `1430` → `14:30`, no formato HHMM que o leiaute do eSocial exige. */
export const formatHora = (hora: string | null | undefined): string => {
  if (!hora) return '—';
  const digits = onlyDigits(hora).padStart(4, '0').slice(0, 4);
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

/** `14:30` (input type=time) → `1430`. */
export const toHoraLeiaute = (valor: string): string => onlyDigits(valor).slice(0, 4);

/** `1430` → `14:30` para preencher um `<input type="time">`. */
export const toHoraInput = (hora: string | null | undefined): string => {
  if (!hora) return '';
  const digits = onlyDigits(hora).padStart(4, '0').slice(0, 4);
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const pluralizar = (quantidade: number, singular: string, plural: string): string =>
  `${quantidade} ${quantidade === 1 ? singular : plural}`;

import { colaboradorApi } from '../api/colaboradorApi.js';
import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../types/colaborador.js';

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export const colaboradorService = {
  async list(empresaId?: string): Promise<Colaborador[]> {
    return colaboradorApi.list(empresaId);
  },

  async create(input: CreateColaboradorData): Promise<Colaborador> {
    return colaboradorApi.create({
      ...input,
      cpf: onlyDigits(input.cpf),
      nome: input.nome.trim(),
      cargo: input.cargo.trim(),
      dataDemissao: input.dataDemissao || null,
    });
  },

  async update(id: string, input: CreateColaboradorData): Promise<Colaborador> {
    const payload: UpdateColaboradorData = {
      empresaId: input.empresaId,
      cpf: onlyDigits(input.cpf),
      nome: input.nome.trim(),
      dataNascimento: input.dataNascimento,
      cargo: input.cargo.trim(),
      dataAdmissao: input.dataAdmissao,
      dataDemissao: input.dataDemissao || null,
    };
    return colaboradorApi.update(id, payload);
  },

  async remove(id: string): Promise<void> {
    return colaboradorApi.remove(id);
  },

  formatCpf(cpf: string): string {
    const digits = onlyDigits(cpf).padStart(11, '0').slice(0, 11);
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  },

  formatDate(date: string | null): string {
    if (!date) return '—';
    const [year, month, day] = date.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  },

  toDateInput(date: string | null): string {
    return date ? date.split('T')[0] : '';
  },
};

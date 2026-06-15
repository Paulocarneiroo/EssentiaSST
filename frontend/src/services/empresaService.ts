import { empresaApi } from '../api/empresaApi.js';
import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../types/empresa.js';

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export const empresaService = {
  async list(): Promise<Empresa[]> {
    return empresaApi.list();
  },

  async create(input: CreateEmpresaData): Promise<Empresa> {
    return empresaApi.create({
      ...input,
      cnpj: onlyDigits(input.cnpj),
      razaoSocial: input.razaoSocial.trim(),
      nomeFantasia: input.nomeFantasia.trim(),
      cnae: input.cnae.trim(),
      grauRisco: Number(input.grauRisco),
    });
  },

  async update(id: string, input: CreateEmpresaData): Promise<Empresa> {
    const payload: UpdateEmpresaData = {
      cnpj: onlyDigits(input.cnpj),
      razaoSocial: input.razaoSocial.trim(),
      nomeFantasia: input.nomeFantasia.trim(),
      cnae: input.cnae.trim(),
      grauRisco: Number(input.grauRisco),
    };
    return empresaApi.update(id, payload);
  },

  async remove(id: string): Promise<void> {
    return empresaApi.remove(id);
  },

  formatCnpj(cnpj: string): string {
    const digits = onlyDigits(cnpj).padStart(14, '0').slice(0, 14);
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  },
};

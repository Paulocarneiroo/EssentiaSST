import { empresaApi } from '../api/empresaApi.js';
import { getEmpresaId } from '../state/session.js';
import type { Empresa, UpdateEmpresaData } from '../types/empresa.js';
import { onlyDigits } from './format.js';

const empresaIdDaSessao = (): string => {
  const id = getEmpresaId();
  if (!id) {
    throw new Error('Sessão sem empresa vinculada. Entre novamente.');
  }
  return id;
};

export const empresaService = {
  /** A empresa do usuário autenticado — o backend não devolve outras (H1.3). */
  async minhaEmpresa(): Promise<Empresa> {
    return empresaApi.getById(empresaIdDaSessao());
  },

  async atualizar(input: UpdateEmpresaData): Promise<Empresa> {
    const payload: UpdateEmpresaData = {
      ...input,
      cnpj: input.cnpj !== undefined ? onlyDigits(input.cnpj) : undefined,
      razaoSocial: input.razaoSocial?.trim(),
      nomeFantasia: input.nomeFantasia?.trim(),
      cnae: input.cnae?.trim(),
      grauRisco: input.grauRisco !== undefined ? Number(input.grauRisco) : undefined,
    };
    return empresaApi.update(empresaIdDaSessao(), payload);
  },
};

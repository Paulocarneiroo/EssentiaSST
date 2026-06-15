export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  grauRisco: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmpresaData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  grauRisco: number;
}

export type UpdateEmpresaData = Partial<CreateEmpresaData>;

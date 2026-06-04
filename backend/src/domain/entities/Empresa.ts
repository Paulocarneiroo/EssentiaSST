export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  grauRisco: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmpresaData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  grauRisco: number;
}

export interface UpdateEmpresaData {
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnae?: string;
  grauRisco?: number;
}

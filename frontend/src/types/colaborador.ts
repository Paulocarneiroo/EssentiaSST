export interface Colaborador {
  id: string;
  empresaId: string;
  cpf: string;
  nome: string;
  dataNascimento: string;
  cargo: string;
  dataAdmissao: string;
  dataDemissao: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColaboradorData {
  empresaId: string;
  cpf: string;
  nome: string;
  dataNascimento: string;
  cargo: string;
  dataAdmissao: string;
  dataDemissao?: string | null;
}

export type UpdateColaboradorData = Partial<CreateColaboradorData>;

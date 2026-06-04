export interface Colaborador {
  id: string;
  empresaId: string;
  cpf: string;
  nome: string;
  dataNascimento: Date;
  cargo: string;
  dataAdmissao: Date;
  dataDemissao: Date | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface UpdateColaboradorData {
  empresaId?: string;
  cpf?: string;
  nome?: string;
  dataNascimento?: string;
  cargo?: string;
  dataAdmissao?: string;
  dataDemissao?: string | null;
}

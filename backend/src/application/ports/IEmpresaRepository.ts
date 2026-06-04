import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../../domain/entities/Empresa.js';

export interface IEmpresaRepository {
  findAll(): Promise<Empresa[]>;
  findById(id: string): Promise<Empresa | null>;
  findByCnpj(cnpj: string): Promise<Empresa | null>;
  create(data: CreateEmpresaData): Promise<Empresa>;
  update(id: string, data: UpdateEmpresaData): Promise<Empresa | null>;
  delete(id: string): Promise<boolean>;
}

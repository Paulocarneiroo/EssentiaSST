import type { Aso, CreateAsoData, UpdateAsoData } from '../../domain/entities/Aso.js';

/** `IRepositorioASO` do modelo de domínio — isola os serviços do banco concreto (DIP). */
export interface IAsoRepository {
  /** Todos os ASOs dos colaboradores do tenant, do mais recente ao mais antigo. */
  findAllByEmpresa(empresaId: string): Promise<Aso[]>;
  findById(id: string): Promise<Aso | null>;
  findByColaborador(colaboradorId: string): Promise<Aso[]>;
  create(data: CreateAsoData): Promise<Aso>;
  update(id: string, data: UpdateAsoData): Promise<Aso | null>;
  delete(id: string): Promise<boolean>;
}

import type {
  Acidente,
  CreateAcidenteData,
  UpdateAcidenteData,
} from '../../domain/entities/Acidente.js';

/** Acesso aos acidentes de trabalho — isola os serviços do banco concreto (DIP). */
export interface IAcidenteRepository {
  /** Todos os acidentes dos colaboradores do tenant, do mais recente ao mais antigo. */
  findAllByEmpresa(empresaId: string): Promise<Acidente[]>;
  findById(id: string): Promise<Acidente | null>;
  findByColaborador(colaboradorId: string): Promise<Acidente[]>;
  create(data: CreateAcidenteData): Promise<Acidente>;
  update(id: string, data: UpdateAcidenteData): Promise<Acidente | null>;
  delete(id: string): Promise<boolean>;
}

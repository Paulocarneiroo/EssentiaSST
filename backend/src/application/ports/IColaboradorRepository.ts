import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../../domain/entities/Colaborador.js';

export interface IColaboradorRepository {
  findAll(empresaId?: string): Promise<Colaborador[]>;
  findById(id: string): Promise<Colaborador | null>;
  findByCpfAndEmpresa(cpf: string, empresaId: string): Promise<Colaborador | null>;
  create(data: CreateColaboradorData): Promise<Colaborador>;
  update(id: string, data: UpdateColaboradorData): Promise<Colaborador | null>;
  delete(id: string): Promise<boolean>;
}

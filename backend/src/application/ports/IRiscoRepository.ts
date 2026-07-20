import type { CreateRiscoData, Risco, UpdateRiscoData } from '../../domain/entities/Risco.js';

export interface IRiscoRepository {
  findAll(empresaId: string): Promise<Risco[]>;
  findById(id: string): Promise<Risco | null>;
  create(data: CreateRiscoData): Promise<Risco>;
  update(id: string, data: UpdateRiscoData): Promise<Risco | null>;
  delete(id: string): Promise<boolean>;
}

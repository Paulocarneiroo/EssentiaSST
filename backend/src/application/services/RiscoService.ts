import type { CreateRiscoData, Risco, UpdateRiscoData } from '../../domain/entities/Risco.js';
import { NotFoundError, ValidationError } from '../../domain/errors/AppError.js';
import { validateCreateRisco, validateUpdateRisco } from '../../domain/validators/riscoValidator.js';
import type { IRiscoRepository } from '../ports/IRiscoRepository.js';

export class RiscoService {
  constructor(private readonly repository: IRiscoRepository) {}

  async list(tenantId: string): Promise<Risco[]> {
    return this.repository.findAll(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<Risco> {
    const risco = await this.repository.findById(id);
    if (!risco || risco.empresaId !== tenantId) {
      throw new NotFoundError(`Risco com id "${id}" não encontrado.`);
    }
    return risco;
  }

  async create(raw: CreateRiscoData, tenantId: string): Promise<Risco> {
    // O risco nasce sempre no tenant do usuário autenticado.
    const data = validateCreateRisco({ ...raw, empresaId: tenantId });
    return this.repository.create(data);
  }

  async update(id: string, raw: UpdateRiscoData, tenantId: string): Promise<Risco> {
    const data = validateUpdateRisco(raw);
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualização.');
    }

    await this.getById(id, tenantId);

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Risco com id "${id}" não encontrado.`);
    }
    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.getById(id, tenantId);
    await this.repository.delete(id);
  }
}

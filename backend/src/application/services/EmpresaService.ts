import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../../domain/entities/Empresa.js';
import { ConflictError, NotFoundError, ValidationError } from '../../domain/errors/AppError.js';
import { validateCreateEmpresa, validateUpdateEmpresa } from '../../domain/validators/empresaValidator.js';
import type { IEmpresaRepository } from '../ports/IEmpresaRepository.js';

export class EmpresaService {
  constructor(private readonly repository: IEmpresaRepository) {}

  /** Lista escopada ao tenant: um usuário só enxerga a própria empresa. */
  async list(tenantId: string): Promise<Empresa[]> {
    const empresa = await this.repository.findById(tenantId);
    return empresa ? [empresa] : [];
  }

  async getById(id: string, tenantId: string): Promise<Empresa> {
    this.assertSameTenant(id, tenantId);
    const empresa = await this.repository.findById(id);
    if (!empresa) {
      throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
    }
    return empresa;
  }

  /** Público — usado no bootstrap do primeiro tenant, sem contexto de usuário. */
  async create(raw: CreateEmpresaData): Promise<Empresa> {
    const data = validateCreateEmpresa(raw);
    const existing = await this.repository.findByCnpj(data.cnpj);
    if (existing) {
      throw new ConflictError(`Já existe uma empresa com o CNPJ ${data.cnpj}.`);
    }
    return this.repository.create(data);
  }

  async update(id: string, raw: UpdateEmpresaData, tenantId: string): Promise<Empresa> {
    this.assertSameTenant(id, tenantId);
    const data = validateUpdateEmpresa(raw);
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualização.');
    }

    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
    }

    if (data.cnpj && data.cnpj !== current.cnpj) {
      const duplicate = await this.repository.findByCnpj(data.cnpj);
      if (duplicate) {
        throw new ConflictError(`Já existe uma empresa com o CNPJ ${data.cnpj}.`);
      }
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
    }
    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    this.assertSameTenant(id, tenantId);
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
    }
  }

  /** Garante que o recurso alvo é a própria empresa do usuário; caso contrário, 404 (não vaza existência). */
  private assertSameTenant(id: string, tenantId: string): void {
    if (id !== tenantId) {
      throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
    }
  }
}

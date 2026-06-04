import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../../domain/entities/Empresa.js';
import { ConflictError, NotFoundError, ValidationError } from '../../domain/errors/AppError.js';
import { validateCreateEmpresa, validateUpdateEmpresa } from '../../domain/validators/empresaValidator.js';
import type { IEmpresaRepository } from '../ports/IEmpresaRepository.js';

export class EmpresaService {
  constructor(private readonly repository: IEmpresaRepository) {}

  async list(): Promise<Empresa[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Empresa> {
    const empresa = await this.repository.findById(id);
    if (!empresa) {
      throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
    }
    return empresa;
  }

  async create(raw: CreateEmpresaData): Promise<Empresa> {
    const data = validateCreateEmpresa(raw);
    const existing = await this.repository.findByCnpj(data.cnpj);
    if (existing) {
      throw new ConflictError(`Já existe uma empresa com o CNPJ ${data.cnpj}.`);
    }
    return this.repository.create(data);
  }

  async update(id: string, raw: UpdateEmpresaData): Promise<Empresa> {
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

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
    }
  }
}

import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../../domain/entities/Colaborador.js';
import { ConflictError, NotFoundError, ValidationError } from '../../domain/errors/AppError.js';
import {
  validateCreateColaborador,
  validateUpdateColaborador,
} from '../../domain/validators/colaboradorValidator.js';
import type { IColaboradorRepository } from '../ports/IColaboradorRepository.js';
import type { IEmpresaRepository } from '../ports/IEmpresaRepository.js';

export class ColaboradorService {
  constructor(
    private readonly colaboradorRepository: IColaboradorRepository,
    private readonly empresaRepository: IEmpresaRepository,
  ) {}

  /** Sempre escopado ao tenant — o usuário só vê colaboradores da própria empresa. */
  async list(tenantId: string): Promise<Colaborador[]> {
    return this.colaboradorRepository.findAll(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<Colaborador> {
    const colaborador = await this.colaboradorRepository.findById(id);
    if (!colaborador || colaborador.empresaId !== tenantId) {
      throw new NotFoundError(`Colaborador com id "${id}" não encontrado.`);
    }
    return colaborador;
  }

  async create(raw: CreateColaboradorData, tenantId: string): Promise<Colaborador> {
    // O tenant é sempre a empresa do usuário autenticado; ignora qualquer empresaId enviado no corpo.
    const data = validateCreateColaborador({ ...raw, empresaId: tenantId });
    await this.ensureEmpresaExists(tenantId);

    const duplicate = await this.colaboradorRepository.findByCpfAndEmpresa(data.cpf, tenantId);
    if (duplicate) {
      throw new ConflictError(`Já existe um colaborador com o CPF ${data.cpf} nesta empresa.`);
    }

    return this.colaboradorRepository.create(data);
  }

  async update(id: string, raw: UpdateColaboradorData, tenantId: string): Promise<Colaborador> {
    // Não é permitido mover um colaborador para outra empresa: descarta empresaId do payload.
    const rest: UpdateColaboradorData = { ...raw };
    delete rest.empresaId;
    const data = validateUpdateColaborador(rest);
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualização.');
    }

    const current = await this.colaboradorRepository.findById(id);
    if (!current || current.empresaId !== tenantId) {
      throw new NotFoundError(`Colaborador com id "${id}" não encontrado.`);
    }

    if (data.cpf && data.cpf !== current.cpf) {
      const duplicate = await this.colaboradorRepository.findByCpfAndEmpresa(data.cpf, tenantId);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Já existe um colaborador com o CPF ${data.cpf} nesta empresa.`);
      }
    }

    const updated = await this.colaboradorRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Colaborador com id "${id}" não encontrado.`);
    }
    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const current = await this.colaboradorRepository.findById(id);
    if (!current || current.empresaId !== tenantId) {
      throw new NotFoundError(`Colaborador com id "${id}" não encontrado.`);
    }
    await this.colaboradorRepository.delete(id);
  }

  private async ensureEmpresaExists(empresaId: string): Promise<void> {
    const empresa = await this.empresaRepository.findById(empresaId);
    if (!empresa) {
      throw new NotFoundError(`Empresa com id "${empresaId}" não encontrada.`);
    }
  }
}

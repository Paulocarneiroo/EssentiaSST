import type {
  Acidente,
  CreateAcidenteData,
  UpdateAcidenteData,
} from '../../domain/entities/Acidente.js';
import { NotFoundError, ValidationError } from '../../domain/errors/AppError.js';
import {
  validateCreateAcidente,
  validateUpdateAcidente,
} from '../../domain/validators/acidenteValidator.js';
import type { IAcidenteRepository } from '../ports/IAcidenteRepository.js';
import type { IColaboradorRepository } from '../ports/IColaboradorRepository.js';

export class AcidenteService {
  constructor(
    private readonly acidenteRepository: IAcidenteRepository,
    private readonly colaboradorRepository: Pick<IColaboradorRepository, 'findById'>,
  ) {}

  async list(tenantId: string, colaboradorId?: string): Promise<Acidente[]> {
    if (colaboradorId) {
      await this.ensureColaboradorDoTenant(colaboradorId, tenantId);
      return this.acidenteRepository.findByColaborador(colaboradorId);
    }
    return this.acidenteRepository.findAllByEmpresa(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<Acidente> {
    const acidente = await this.acidenteRepository.findById(id);
    if (!acidente) {
      throw new NotFoundError(`Acidente com id "${id}" não encontrado.`);
    }
    // O acidente herda o tenant do colaborador acidentado.
    await this.ensureColaboradorDoTenant(
      acidente.colaboradorId,
      tenantId,
      `Acidente com id "${id}"`,
    );
    return acidente;
  }

  async create(raw: CreateAcidenteData, tenantId: string): Promise<Acidente> {
    const data = validateCreateAcidente(raw);
    const colaborador = await this.ensureColaboradorDoTenant(data.colaboradorId, tenantId);

    if (new Date(data.dataAcidente) < colaborador.dataAdmissao) {
      throw new ValidationError('O acidente não pode ser anterior à admissão do colaborador.');
    }

    return this.acidenteRepository.create(data);
  }

  async update(id: string, raw: UpdateAcidenteData, tenantId: string): Promise<Acidente> {
    const data = validateUpdateAcidente(raw);
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualização.');
    }

    await this.getById(id, tenantId);

    const atualizado = await this.acidenteRepository.update(id, data);
    if (!atualizado) {
      throw new NotFoundError(`Acidente com id "${id}" não encontrado.`);
    }
    return atualizado;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.getById(id, tenantId);
    await this.acidenteRepository.delete(id);
  }

  /** Recurso de outro tenant é indistinguível de inexistente (H1.3). */
  private async ensureColaboradorDoTenant(
    colaboradorId: string,
    tenantId: string,
    rotulo = `Colaborador com id "${colaboradorId}"`,
  ) {
    const colaborador = await this.colaboradorRepository.findById(colaboradorId);
    if (!colaborador || colaborador.empresaId !== tenantId) {
      throw new NotFoundError(`${rotulo} não encontrado.`);
    }
    return colaborador;
  }
}

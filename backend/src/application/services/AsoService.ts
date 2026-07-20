import type { Aso, CreateAsoData, UpdateAsoData } from '../../domain/entities/Aso.js';
import { NotFoundError, ValidationError } from '../../domain/errors/AppError.js';
import { validateCreateAso, validateUpdateAso } from '../../domain/validators/asoValidator.js';
import type { IAsoRepository } from '../ports/IAsoRepository.js';
import type { IColaboradorRepository } from '../ports/IColaboradorRepository.js';

export class AsoService {
  constructor(
    private readonly asoRepository: IAsoRepository,
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async list(tenantId: string, colaboradorId?: string): Promise<Aso[]> {
    if (colaboradorId) {
      await this.ensureColaboradorDoTenant(colaboradorId, tenantId);
      return this.asoRepository.findByColaborador(colaboradorId);
    }
    return this.asoRepository.findAllByEmpresa(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<Aso> {
    const aso = await this.asoRepository.findById(id);
    if (!aso) {
      throw new NotFoundError(`ASO com id "${id}" não encontrado.`);
    }
    // O ASO herda o tenant do colaborador ao qual pertence.
    await this.ensureColaboradorDoTenant(aso.colaboradorId, tenantId, `ASO com id "${id}"`);
    return aso;
  }

  async create(raw: CreateAsoData, tenantId: string): Promise<Aso> {
    const data = validateCreateAso(raw);
    const colaborador = await this.ensureColaboradorDoTenant(data.colaboradorId, tenantId);

    if (new Date(data.dataExame) < colaborador.dataAdmissao && data.tipoExame !== 'ADMISSIONAL') {
      throw new ValidationError(
        'Somente o exame admissional pode ser anterior à data de admissão do colaborador.',
      );
    }

    return this.asoRepository.create(data);
  }

  async update(id: string, raw: UpdateAsoData, tenantId: string): Promise<Aso> {
    const data = validateUpdateAso(raw);
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualização.');
    }

    await this.getById(id, tenantId);

    const updated = await this.asoRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`ASO com id "${id}" não encontrado.`);
    }
    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.getById(id, tenantId);
    await this.asoRepository.delete(id);
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

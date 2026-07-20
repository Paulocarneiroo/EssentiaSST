import type { Prisma, Risco as RiscoModel } from '@prisma/client';
import type { CreateRiscoData, Risco, UpdateRiscoData } from '../../domain/entities/Risco.js';
import type { IRiscoRepository } from '../../application/ports/IRiscoRepository.js';
import { prisma } from '../database/prisma.js';
import { isRecordNotFound } from './prismaErrors.js';

const toRisco = (row: RiscoModel): Risco => ({
  id: row.id,
  empresaId: row.empresaId,
  descricao: row.descricao,
  tipo: row.tipo,
  severidade: row.severidade,
  probabilidade: row.probabilidade,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class RiscoRepositoryPrisma implements IRiscoRepository {
  async findAll(empresaId: string): Promise<Risco[]> {
    const rows = await prisma.risco.findMany({
      where: { empresaId },
      orderBy: [{ severidade: 'desc' }, { probabilidade: 'desc' }],
    });
    return rows.map(toRisco);
  }

  async findById(id: string): Promise<Risco | null> {
    const row = await prisma.risco.findUnique({ where: { id } });
    return row ? toRisco(row) : null;
  }

  async create(data: CreateRiscoData): Promise<Risco> {
    const row = await prisma.risco.create({
      data: {
        empresaId: data.empresaId,
        descricao: data.descricao,
        tipo: data.tipo,
        severidade: data.severidade,
        probabilidade: data.probabilidade,
      },
    });
    return toRisco(row);
  }

  async update(id: string, data: UpdateRiscoData): Promise<Risco | null> {
    const patch: Prisma.RiscoUpdateInput = {};
    if (data.descricao !== undefined) patch.descricao = data.descricao;
    if (data.tipo !== undefined) patch.tipo = data.tipo;
    if (data.severidade !== undefined) patch.severidade = data.severidade;
    if (data.probabilidade !== undefined) patch.probabilidade = data.probabilidade;

    try {
      const row = await prisma.risco.update({ where: { id }, data: patch });
      return toRisco(row);
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.risco.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
}

import type { Aso as AsoModel, Prisma } from '@prisma/client';
import type { Aso, CreateAsoData, UpdateAsoData } from '../../domain/entities/Aso.js';
import type { IAsoRepository } from '../../application/ports/IAsoRepository.js';
import { prisma } from '../database/prisma.js';
import { isRecordNotFound } from './prismaErrors.js';

const toAso = (row: AsoModel): Aso => ({
  id: row.id,
  colaboradorId: row.colaboradorId,
  tipoExame: row.tipoExame,
  dataExame: row.dataExame,
  resultado: row.resultado,
  medico: row.medico,
  crm: row.crm,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class AsoRepositoryPrisma implements IAsoRepository {
  /** Filtra pela empresa do colaborador — o ASO não guarda empresaId próprio. */
  async findAllByEmpresa(empresaId: string): Promise<Aso[]> {
    const rows = await prisma.aso.findMany({
      where: { colaborador: { empresaId } },
      orderBy: { dataExame: 'desc' },
    });
    return rows.map(toAso);
  }

  async findById(id: string): Promise<Aso | null> {
    const row = await prisma.aso.findUnique({ where: { id } });
    return row ? toAso(row) : null;
  }

  async findByColaborador(colaboradorId: string): Promise<Aso[]> {
    const rows = await prisma.aso.findMany({
      where: { colaboradorId },
      orderBy: { dataExame: 'desc' },
    });
    return rows.map(toAso);
  }

  async create(data: CreateAsoData): Promise<Aso> {
    const row = await prisma.aso.create({
      data: {
        colaboradorId: data.colaboradorId,
        tipoExame: data.tipoExame,
        dataExame: new Date(data.dataExame),
        resultado: data.resultado,
        medico: data.medico,
        crm: data.crm,
      },
    });
    return toAso(row);
  }

  async update(id: string, data: UpdateAsoData): Promise<Aso | null> {
    const patch: Prisma.AsoUpdateInput = {};
    if (data.tipoExame !== undefined) patch.tipoExame = data.tipoExame;
    if (data.resultado !== undefined) patch.resultado = data.resultado;
    if (data.dataExame !== undefined) patch.dataExame = new Date(data.dataExame);
    if (data.medico !== undefined) patch.medico = data.medico;
    if (data.crm !== undefined) patch.crm = data.crm;

    try {
      const row = await prisma.aso.update({ where: { id }, data: patch });
      return toAso(row);
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.aso.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
}

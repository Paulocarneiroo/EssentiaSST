import type { Empresa as EmpresaModel } from '@prisma/client';
import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../../domain/entities/Empresa.js';
import type { IEmpresaRepository } from '../../application/ports/IEmpresaRepository.js';
import { prisma } from '../database/prisma.js';

const toEmpresa = (row: EmpresaModel): Empresa => ({
  id: row.id,
  cnpj: row.cnpj,
  razaoSocial: row.razaoSocial,
  nomeFantasia: row.nomeFantasia,
  cnae: row.cnae,
  grauRisco: row.grauRisco,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class EmpresaRepositoryPrisma implements IEmpresaRepository {
  async findAll(): Promise<Empresa[]> {
    const rows = await prisma.empresa.findMany({ orderBy: { razaoSocial: 'asc' } });
    return rows.map(toEmpresa);
  }

  async findById(id: string): Promise<Empresa | null> {
    const row = await prisma.empresa.findUnique({ where: { id } });
    return row ? toEmpresa(row) : null;
  }

  async findByCnpj(cnpj: string): Promise<Empresa | null> {
    const row = await prisma.empresa.findUnique({ where: { cnpj } });
    return row ? toEmpresa(row) : null;
  }

  async create(data: CreateEmpresaData): Promise<Empresa> {
    const row = await prisma.empresa.create({
      data: {
        cnpj: data.cnpj,
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia,
        cnae: data.cnae,
        grauRisco: data.grauRisco,
      },
    });
    return toEmpresa(row);
  }

  async update(id: string, data: UpdateEmpresaData): Promise<Empresa | null> {
    try {
      const row = await prisma.empresa.update({
        where: { id },
        data: {
          cnpj: data.cnpj,
          razaoSocial: data.razaoSocial,
          nomeFantasia: data.nomeFantasia,
          cnae: data.cnae,
          grauRisco: data.grauRisco,
        },
      });
      return toEmpresa(row);
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.empresa.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
}

/** Prisma lança P2025 quando o registro alvo de update/delete não existe. */
const isRecordNotFound = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';

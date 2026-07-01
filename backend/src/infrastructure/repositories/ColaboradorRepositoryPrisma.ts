import type { Colaborador as ColaboradorModel, Prisma } from '@prisma/client';
import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../../domain/entities/Colaborador.js';
import type { IColaboradorRepository } from '../../application/ports/IColaboradorRepository.js';
import { prisma } from '../database/prisma.js';

const toColaborador = (row: ColaboradorModel): Colaborador => ({
  id: row.id,
  empresaId: row.empresaId,
  cpf: row.cpf,
  nome: row.nome,
  dataNascimento: row.dataNascimento,
  cargo: row.cargo,
  dataAdmissao: row.dataAdmissao,
  dataDemissao: row.dataDemissao,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class ColaboradorRepositoryPrisma implements IColaboradorRepository {
  async findAll(empresaId?: string): Promise<Colaborador[]> {
    const rows = await prisma.colaborador.findMany({
      where: empresaId ? { empresaId } : undefined,
      orderBy: { nome: 'asc' },
    });
    return rows.map(toColaborador);
  }

  async findById(id: string): Promise<Colaborador | null> {
    const row = await prisma.colaborador.findUnique({ where: { id } });
    return row ? toColaborador(row) : null;
  }

  async findByCpfAndEmpresa(cpf: string, empresaId: string): Promise<Colaborador | null> {
    const row = await prisma.colaborador.findUnique({
      where: { empresaId_cpf: { empresaId, cpf } },
    });
    return row ? toColaborador(row) : null;
  }

  async create(data: CreateColaboradorData): Promise<Colaborador> {
    const row = await prisma.colaborador.create({
      data: {
        empresaId: data.empresaId,
        cpf: data.cpf,
        nome: data.nome,
        dataNascimento: new Date(data.dataNascimento),
        cargo: data.cargo,
        dataAdmissao: new Date(data.dataAdmissao),
        dataDemissao: data.dataDemissao ? new Date(data.dataDemissao) : null,
      },
    });
    return toColaborador(row);
  }

  async update(id: string, data: UpdateColaboradorData): Promise<Colaborador | null> {
    const patch: Prisma.ColaboradorUpdateInput = {};
    if (data.cpf !== undefined) patch.cpf = data.cpf;
    if (data.nome !== undefined) patch.nome = data.nome;
    if (data.cargo !== undefined) patch.cargo = data.cargo;
    if (data.dataNascimento !== undefined) patch.dataNascimento = new Date(data.dataNascimento);
    if (data.dataAdmissao !== undefined) patch.dataAdmissao = new Date(data.dataAdmissao);
    if (data.dataDemissao !== undefined) {
      patch.dataDemissao = data.dataDemissao ? new Date(data.dataDemissao) : null;
    }
    if (data.empresaId !== undefined) {
      patch.empresa = { connect: { id: data.empresaId } };
    }

    try {
      const row = await prisma.colaborador.update({ where: { id }, data: patch });
      return toColaborador(row);
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.colaborador.delete({ where: { id } });
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

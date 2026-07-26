import type { Acidente as AcidenteModel, Prisma } from '@prisma/client';
import type {
  Acidente,
  CreateAcidenteData,
  UpdateAcidenteData,
} from '../../domain/entities/Acidente.js';
import type { IAcidenteRepository } from '../../application/ports/IAcidenteRepository.js';
import { prisma } from '../database/prisma.js';
import { isRecordNotFound } from './prismaErrors.js';

const toAcidente = (row: AcidenteModel): Acidente => ({
  id: row.id,
  colaboradorId: row.colaboradorId,
  dataAcidente: row.dataAcidente,
  horaAcidente: row.horaAcidente,
  horasTrabalhadasAntes: row.horasTrabalhadasAntes,
  tipoAcidente: row.tipoAcidente,
  tipoCat: row.tipoCat,
  obito: row.obito,
  dataObito: row.dataObito,
  comunicadoPolicia: row.comunicadoPolicia,
  localAcidente: row.localAcidente,
  parteAtingida: row.parteAtingida,
  agenteCausador: row.agenteCausador,
  tipoLesao: row.tipoLesao,
  descricao: row.descricao,
  cid: row.cid,
  dataAtendimento: row.dataAtendimento,
  horaAtendimento: row.horaAtendimento,
  houveInternacao: row.houveInternacao,
  houveAfastamento: row.houveAfastamento,
  duracaoTratamentoDias: row.duracaoTratamentoDias,
  medico: row.medico,
  crm: row.crm,
  ufCrm: row.ufCrm,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class AcidenteRepositoryPrisma implements IAcidenteRepository {
  async findAllByEmpresa(empresaId: string): Promise<Acidente[]> {
    const rows = await prisma.acidente.findMany({
      where: { colaborador: { empresaId } },
      orderBy: { dataAcidente: 'desc' },
    });
    return rows.map(toAcidente);
  }

  async findById(id: string): Promise<Acidente | null> {
    const row = await prisma.acidente.findUnique({ where: { id } });
    return row ? toAcidente(row) : null;
  }

  async findByColaborador(colaboradorId: string): Promise<Acidente[]> {
    const rows = await prisma.acidente.findMany({
      where: { colaboradorId },
      orderBy: { dataAcidente: 'desc' },
    });
    return rows.map(toAcidente);
  }

  async create(data: CreateAcidenteData): Promise<Acidente> {
    const row = await prisma.acidente.create({
      data: {
        colaboradorId: data.colaboradorId,
        dataAcidente: new Date(data.dataAcidente),
        horaAcidente: data.horaAcidente,
        horasTrabalhadasAntes: data.horasTrabalhadasAntes,
        tipoAcidente: data.tipoAcidente,
        tipoCat: data.tipoCat ?? 'INICIAL',
        obito: data.obito ?? false,
        dataObito: data.dataObito ? new Date(data.dataObito) : null,
        comunicadoPolicia: data.comunicadoPolicia ?? false,
        localAcidente: data.localAcidente,
        parteAtingida: data.parteAtingida,
        agenteCausador: data.agenteCausador,
        tipoLesao: data.tipoLesao,
        descricao: data.descricao,
        cid: data.cid ?? null,
        dataAtendimento: new Date(data.dataAtendimento),
        horaAtendimento: data.horaAtendimento,
        houveInternacao: data.houveInternacao ?? false,
        houveAfastamento: data.houveAfastamento ?? false,
        duracaoTratamentoDias: data.duracaoTratamentoDias ?? 0,
        medico: data.medico,
        crm: data.crm,
        ufCrm: data.ufCrm,
      },
    });
    return toAcidente(row);
  }

  async update(id: string, data: UpdateAcidenteData): Promise<Acidente | null> {
    const patch: Prisma.AcidenteUpdateInput = {};

    if (data.dataAcidente !== undefined) patch.dataAcidente = new Date(data.dataAcidente);
    if (data.horaAcidente !== undefined) patch.horaAcidente = data.horaAcidente;
    if (data.horasTrabalhadasAntes !== undefined) {
      patch.horasTrabalhadasAntes = data.horasTrabalhadasAntes;
    }
    if (data.tipoAcidente !== undefined) patch.tipoAcidente = data.tipoAcidente;
    if (data.tipoCat !== undefined) patch.tipoCat = data.tipoCat;
    if (data.obito !== undefined) patch.obito = data.obito;
    if (data.dataObito !== undefined) {
      patch.dataObito = data.dataObito ? new Date(data.dataObito) : null;
    }
    if (data.comunicadoPolicia !== undefined) patch.comunicadoPolicia = data.comunicadoPolicia;
    if (data.localAcidente !== undefined) patch.localAcidente = data.localAcidente;
    if (data.parteAtingida !== undefined) patch.parteAtingida = data.parteAtingida;
    if (data.agenteCausador !== undefined) patch.agenteCausador = data.agenteCausador;
    if (data.tipoLesao !== undefined) patch.tipoLesao = data.tipoLesao;
    if (data.descricao !== undefined) patch.descricao = data.descricao;
    if (data.cid !== undefined) patch.cid = data.cid;
    if (data.dataAtendimento !== undefined) patch.dataAtendimento = new Date(data.dataAtendimento);
    if (data.horaAtendimento !== undefined) patch.horaAtendimento = data.horaAtendimento;
    if (data.houveInternacao !== undefined) patch.houveInternacao = data.houveInternacao;
    if (data.houveAfastamento !== undefined) patch.houveAfastamento = data.houveAfastamento;
    if (data.duracaoTratamentoDias !== undefined) {
      patch.duracaoTratamentoDias = data.duracaoTratamentoDias;
    }
    if (data.medico !== undefined) patch.medico = data.medico;
    if (data.crm !== undefined) patch.crm = data.crm;
    if (data.ufCrm !== undefined) patch.ufCrm = data.ufCrm;

    try {
      const row = await prisma.acidente.update({ where: { id }, data: patch });
      return toAcidente(row);
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.acidente.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
}

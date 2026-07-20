import type { EventoESocial as EventoModel, Prisma } from '@prisma/client';
import type {
  CreateEventoESocialData,
  EventoESocial,
  UpdateEventoESocialData,
} from '../../domain/entities/EventoESocial.js';
import type { IEventoESocialRepository } from '../../application/ports/IEventoESocialRepository.js';
import { prisma } from '../database/prisma.js';
import { isRecordNotFound } from './prismaErrors.js';

const toEvento = (row: EventoModel): EventoESocial => ({
  id: row.id,
  empresaId: row.empresaId,
  colaboradorId: row.colaboradorId,
  asoId: row.asoId,
  riscoId: row.riscoId,
  tipoEvento: row.tipoEvento,
  payloadXml: row.payloadXml,
  status: row.status,
  ambiente: row.ambiente,
  protocolo: row.protocolo,
  mensagemErro: row.mensagemErro,
  dataEnvio: row.dataEnvio,
  tentativas: row.tentativas,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class EventoESocialRepositoryPrisma implements IEventoESocialRepository {
  async findAll(empresaId: string): Promise<EventoESocial[]> {
    const rows = await prisma.eventoESocial.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEvento);
  }

  async findById(id: string): Promise<EventoESocial | null> {
    const row = await prisma.eventoESocial.findUnique({ where: { id } });
    return row ? toEvento(row) : null;
  }

  async create(data: CreateEventoESocialData): Promise<EventoESocial> {
    const row = await prisma.eventoESocial.create({
      data: {
        empresaId: data.empresaId,
        colaboradorId: data.colaboradorId,
        asoId: data.asoId,
        riscoId: data.riscoId,
        tipoEvento: data.tipoEvento,
        payloadXml: data.payloadXml,
        ambiente: data.ambiente,
      },
    });
    return toEvento(row);
  }

  async update(id: string, data: UpdateEventoESocialData): Promise<EventoESocial | null> {
    const patch: Prisma.EventoESocialUpdateInput = {};
    if (data.payloadXml !== undefined) patch.payloadXml = data.payloadXml;
    if (data.status !== undefined) patch.status = data.status;
    if (data.ambiente !== undefined) patch.ambiente = data.ambiente;
    if (data.protocolo !== undefined) patch.protocolo = data.protocolo;
    if (data.mensagemErro !== undefined) patch.mensagemErro = data.mensagemErro;
    if (data.dataEnvio !== undefined) patch.dataEnvio = data.dataEnvio;
    if (data.tentativas !== undefined) patch.tentativas = data.tentativas;

    try {
      const row = await prisma.eventoESocial.update({ where: { id }, data: patch });
      return toEvento(row);
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }
}

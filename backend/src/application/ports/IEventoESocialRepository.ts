import type {
  CreateEventoESocialData,
  EventoESocial,
  UpdateEventoESocialData,
} from '../../domain/entities/EventoESocial.js';

export interface IEventoESocialRepository {
  findAll(empresaId: string): Promise<EventoESocial[]>;
  findById(id: string): Promise<EventoESocial | null>;
  create(data: CreateEventoESocialData): Promise<EventoESocial>;
  update(id: string, data: UpdateEventoESocialData): Promise<EventoESocial | null>;
}

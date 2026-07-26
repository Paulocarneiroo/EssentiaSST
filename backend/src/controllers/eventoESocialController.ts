import type { RequestHandler } from 'express';
import { ValidationError } from '../domain/errors/AppError.js';
import { servicoEnvioESocial } from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';
import { getTenantId } from '../utils/tenant.js';

export const listEventos: RequestHandler = async (req, res, next) => {
  try {
    const eventos = await servicoEnvioESocial.list(getTenantId(req));
    res.json(eventos);
  } catch (error) {
    next(error);
  }
};

export const getEventoById: RequestHandler = async (req, res, next) => {
  try {
    const evento = await servicoEnvioESocial.getById(getRouteParam(req, 'id'), getTenantId(req));
    res.json(evento);
  } catch (error) {
    next(error);
  }
};

/** Devolve o XML do evento como `application/xml`, para inspeção e download. */
export const getEventoXml: RequestHandler = async (req, res, next) => {
  try {
    const evento = await servicoEnvioESocial.getById(getRouteParam(req, 'id'), getTenantId(req));
    res.type('application/xml').send(evento.payloadXml);
  } catch (error) {
    next(error);
  }
};

export const gerarDeAso: RequestHandler = async (req, res, next) => {
  try {
    const { asoId } = req.body as { asoId?: string };
    if (!asoId?.trim()) {
      throw new ValidationError('asoId é obrigatório.');
    }
    const evento = await servicoEnvioESocial.gerarDeAso(asoId.trim(), getTenantId(req));
    res.status(201).json(evento);
  } catch (error) {
    next(error);
  }
};

export const gerarDeAcidente: RequestHandler = async (req, res, next) => {
  try {
    const { acidenteId } = req.body as { acidenteId?: string };
    if (!acidenteId?.trim()) {
      throw new ValidationError('acidenteId é obrigatório.');
    }
    const evento = await servicoEnvioESocial.gerarDeAcidente(acidenteId.trim(), getTenantId(req));
    res.status(201).json(evento);
  } catch (error) {
    next(error);
  }
};

export const gerarDeRisco: RequestHandler = async (req, res, next) => {
  try {
    const { riscoId, colaboradorId } = req.body as { riscoId?: string; colaboradorId?: string };
    if (!riscoId?.trim()) {
      throw new ValidationError('riscoId é obrigatório.');
    }
    if (!colaboradorId?.trim()) {
      throw new ValidationError(
        'colaboradorId é obrigatório: o S-2240 declara a exposição de um trabalhador específico.',
      );
    }
    const evento = await servicoEnvioESocial.gerarDeRisco(
      { riscoId: riscoId.trim(), colaboradorId: colaboradorId.trim() },
      getTenantId(req),
    );
    res.status(201).json(evento);
  } catch (error) {
    next(error);
  }
};

export const enviarEvento: RequestHandler = async (req, res, next) => {
  try {
    const evento = await servicoEnvioESocial.enviar(getRouteParam(req, 'id'), getTenantId(req));
    res.json(evento);
  } catch (error) {
    next(error);
  }
};

export const reenviarEvento: RequestHandler = async (req, res, next) => {
  try {
    const evento = await servicoEnvioESocial.reenviar(getRouteParam(req, 'id'), getTenantId(req));
    res.json(evento);
  } catch (error) {
    next(error);
  }
};

import type { RequestHandler } from 'express';
import type { CreateAcidenteData, UpdateAcidenteData } from '../domain/entities/Acidente.js';
import { acidenteService } from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';
import { getTenantId } from '../utils/tenant.js';

export const listAcidentes: RequestHandler = async (req, res, next) => {
  try {
    const colaboradorId =
      typeof req.query.colaboradorId === 'string' ? req.query.colaboradorId : undefined;
    res.json(await acidenteService.list(getTenantId(req), colaboradorId));
  } catch (error) {
    next(error);
  }
};

export const getAcidenteById: RequestHandler = async (req, res, next) => {
  try {
    res.json(await acidenteService.getById(getRouteParam(req, 'id'), getTenantId(req)));
  } catch (error) {
    next(error);
  }
};

export const createAcidente: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateAcidenteData;
    res.status(201).json(await acidenteService.create(body, getTenantId(req)));
  } catch (error) {
    next(error);
  }
};

export const updateAcidente: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as UpdateAcidenteData;
    res.json(await acidenteService.update(getRouteParam(req, 'id'), body, getTenantId(req)));
  } catch (error) {
    next(error);
  }
};

export const deleteAcidente: RequestHandler = async (req, res, next) => {
  try {
    await acidenteService.remove(getRouteParam(req, 'id'), getTenantId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

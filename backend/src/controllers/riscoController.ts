import type { RequestHandler } from 'express';
import type { CreateRiscoData, UpdateRiscoData } from '../domain/entities/Risco.js';
import { riscoService } from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';
import { getTenantId } from '../utils/tenant.js';

export const listRiscos: RequestHandler = async (req, res, next) => {
  try {
    const riscos = await riscoService.list(getTenantId(req));
    res.json(riscos);
  } catch (error) {
    next(error);
  }
};

export const getRiscoById: RequestHandler = async (req, res, next) => {
  try {
    const risco = await riscoService.getById(getRouteParam(req, 'id'), getTenantId(req));
    res.json(risco);
  } catch (error) {
    next(error);
  }
};

export const createRisco: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateRiscoData;
    const risco = await riscoService.create(body, getTenantId(req));
    res.status(201).json(risco);
  } catch (error) {
    next(error);
  }
};

export const updateRisco: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as UpdateRiscoData;
    const risco = await riscoService.update(getRouteParam(req, 'id'), body, getTenantId(req));
    res.json(risco);
  } catch (error) {
    next(error);
  }
};

export const deleteRisco: RequestHandler = async (req, res, next) => {
  try {
    await riscoService.remove(getRouteParam(req, 'id'), getTenantId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

import type { RequestHandler } from 'express';
import type { CreateAsoData, UpdateAsoData } from '../domain/entities/Aso.js';
import { asoService } from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';
import { getTenantId } from '../utils/tenant.js';

export const listAsos: RequestHandler = async (req, res, next) => {
  try {
    const colaboradorId =
      typeof req.query.colaboradorId === 'string' ? req.query.colaboradorId : undefined;
    const asos = await asoService.list(getTenantId(req), colaboradorId);
    res.json(asos);
  } catch (error) {
    next(error);
  }
};

export const getAsoById: RequestHandler = async (req, res, next) => {
  try {
    const aso = await asoService.getById(getRouteParam(req, 'id'), getTenantId(req));
    res.json(aso);
  } catch (error) {
    next(error);
  }
};

export const createAso: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateAsoData;
    const aso = await asoService.create(body, getTenantId(req));
    res.status(201).json(aso);
  } catch (error) {
    next(error);
  }
};

export const updateAso: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as UpdateAsoData;
    const aso = await asoService.update(getRouteParam(req, 'id'), body, getTenantId(req));
    res.json(aso);
  } catch (error) {
    next(error);
  }
};

export const deleteAso: RequestHandler = async (req, res, next) => {
  try {
    await asoService.remove(getRouteParam(req, 'id'), getTenantId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

import type { RequestHandler } from 'express';
import type { CreateColaboradorData, UpdateColaboradorData } from '../domain/entities/Colaborador.js';
import { colaboradorService } from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';
import { getTenantId } from '../utils/tenant.js';

export const listColaboradores: RequestHandler = async (req, res, next) => {
  try {
    const colaboradores = await colaboradorService.list(getTenantId(req));
    res.json(colaboradores);
  } catch (error) {
    next(error);
  }
};

export const getColaboradorById: RequestHandler = async (req, res, next) => {
  try {
    const colaborador = await colaboradorService.getById(getRouteParam(req, 'id'), getTenantId(req));
    res.json(colaborador);
  } catch (error) {
    next(error);
  }
};

export const createColaborador: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateColaboradorData;
    const colaborador = await colaboradorService.create(body, getTenantId(req));
    res.status(201).json(colaborador);
  } catch (error) {
    next(error);
  }
};

export const updateColaborador: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as UpdateColaboradorData;
    const colaborador = await colaboradorService.update(
      getRouteParam(req, 'id'),
      body,
      getTenantId(req),
    );
    res.json(colaborador);
  } catch (error) {
    next(error);
  }
};

export const deleteColaborador: RequestHandler = async (req, res, next) => {
  try {
    await colaboradorService.remove(getRouteParam(req, 'id'), getTenantId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

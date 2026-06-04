import type { RequestHandler } from 'express';
import type { CreateColaboradorData, UpdateColaboradorData } from '../domain/entities/Colaborador.js';
import { colaboradorService } from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';

export const listColaboradores: RequestHandler = async (req, res, next) => {
  try {
    const empresaId = typeof req.query.empresaId === 'string' ? req.query.empresaId : undefined;
    const colaboradores = await colaboradorService.list(empresaId);
    res.json(colaboradores);
  } catch (error) {
    next(error);
  }
};

export const getColaboradorById: RequestHandler = async (req, res, next) => {
  try {
    const colaborador = await colaboradorService.getById(getRouteParam(req, 'id'));
    res.json(colaborador);
  } catch (error) {
    next(error);
  }
};

export const createColaborador: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateColaboradorData;
    const colaborador = await colaboradorService.create(body);
    res.status(201).json(colaborador);
  } catch (error) {
    next(error);
  }
};

export const updateColaborador: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as UpdateColaboradorData;
    const colaborador = await colaboradorService.update(getRouteParam(req, 'id'), body);
    res.json(colaborador);
  } catch (error) {
    next(error);
  }
};

export const deleteColaborador: RequestHandler = async (req, res, next) => {
  try {
    await colaboradorService.remove(getRouteParam(req, 'id'));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

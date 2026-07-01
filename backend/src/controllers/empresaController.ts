import type { RequestHandler } from 'express';
import type { CreateEmpresaData, UpdateEmpresaData } from '../domain/entities/Empresa.js';
import { empresaService } from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';
import { getTenantId } from '../utils/tenant.js';

export const listEmpresas: RequestHandler = async (req, res, next) => {
  try {
    const empresas = await empresaService.list(getTenantId(req));
    res.json(empresas);
  } catch (error) {
    next(error);
  }
};

export const getEmpresaById: RequestHandler = async (req, res, next) => {
  try {
    const empresa = await empresaService.getById(getRouteParam(req, 'id'), getTenantId(req));
    res.json(empresa);
  } catch (error) {
    next(error);
  }
};

export const createEmpresa: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateEmpresaData;
    const empresa = await empresaService.create(body);
    res.status(201).json(empresa);
  } catch (error) {
    next(error);
  }
};

export const updateEmpresa: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as UpdateEmpresaData;
    const empresa = await empresaService.update(getRouteParam(req, 'id'), body, getTenantId(req));
    res.json(empresa);
  } catch (error) {
    next(error);
  }
};

export const deleteEmpresa: RequestHandler = async (req, res, next) => {
  try {
    await empresaService.remove(getRouteParam(req, 'id'), getTenantId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

import type { RequestHandler } from 'express';
import {
  aptidaoService,
  colaboradorService,
  empresaService,
} from '../infrastructure/di/container.js';
import { getRouteParam } from '../utils/routeParams.js';
import { getTenantId } from '../utils/tenant.js';

/**
 * Situação de aptidão do colaborador.
 * O controller carrega colaborador e empresa (já com verificação de tenant) e
 * delega a regra ao `AptidaoService`, que só conhece o repositório de ASOs.
 */
export const getAptidao: RequestHandler = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);

    const colaborador = await colaboradorService.getById(getRouteParam(req, 'id'), tenantId);
    const empresa = await empresaService.getById(tenantId, tenantId);

    res.json(await aptidaoService.avaliarAptidao(colaborador, empresa));
  } catch (error) {
    next(error);
  }
};

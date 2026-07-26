import type { RequestHandler } from 'express';
import { ValidationError } from '../domain/errors/AppError.js';
import {
  criarGeradorRelatorioPGR,
  empresaService,
  riscoService,
  FORMATOS_RELATORIO,
  type FormatoRelatorio,
} from '../infrastructure/di/container.js';
import { getTenantId } from '../utils/tenant.js';

const parseFormato = (valor: unknown): FormatoRelatorio => {
  if (valor === undefined || valor === '') {
    return 'html';
  }
  if (typeof valor !== 'string' || !FORMATOS_RELATORIO.includes(valor as FormatoRelatorio)) {
    throw new ValidationError(
      `Formato inválido. Use um destes: ${FORMATOS_RELATORIO.join(', ')}.`,
    );
  }
  return valor as FormatoRelatorio;
};

/** Relatório do PGR da empresa do usuário autenticado. */
export const getRelatorioPgr: RequestHandler = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const formato = parseFormato(req.query.formato);

    const empresa = await empresaService.getById(tenantId, tenantId);
    const riscos = await riscoService.list(tenantId);

    const documento = criarGeradorRelatorioPGR(formato).gerar(empresa, riscos);
    const arquivo = `pgr-${empresa.cnpj}-${new Date().toISOString().slice(0, 10)}.${documento.extensao}`;

    res.setHeader('Content-Type', documento.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${arquivo}"`);
    res.send(documento.conteudo);
  } catch (error) {
    next(error);
  }
};

import type { Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthTokenPayload } from '../domain/entities/Usuario.js';
import { AppError } from '../domain/errors/AppError.js';
import { tokenService } from '../infrastructure/di/container.js';
import { authenticate, authorize } from './authMiddleware.js';

const PAYLOAD: AuthTokenPayload = {
  sub: '33333333-3333-3333-3333-333333333333',
  empresaId: '11111111-1111-1111-1111-111111111111',
  papel: 'OPERADOR',
};

const requisicao = (patch: Partial<Request> = {}): Request =>
  ({ headers: {}, ...patch }) as Request;

const comToken = (token: string): Request =>
  requisicao({ headers: { authorization: `Bearer ${token}` } });

/** Executa o middleware e devolve o erro entregue ao `next`, se houver. */
const executar = (handler: RequestHandler, req: Request): AppError | null => {
  let capturado: unknown = null;
  handler(req, {} as Response, (erro?: unknown) => {
    capturado = erro ?? null;
  });

  if (capturado === null) {
    return null;
  }
  if (capturado instanceof AppError) {
    return capturado;
  }
  throw capturado;
};

describe('authenticate — H2.3 (proteção de recursos)', () => {
  it('recusa requisição sem cabeçalho Authorization', () => {
    const erro = executar(authenticate, requisicao());

    expect(erro?.status).toBe(401);
  });

  it('recusa cabeçalho que não usa o esquema Bearer', () => {
    const erro = executar(
      authenticate,
      requisicao({ headers: { authorization: `Basic ${tokenService.sign(PAYLOAD)}` } }),
    );

    expect(erro?.status).toBe(401);
  });

  it('recusa token assinado com outro segredo', () => {
    const forjado = jwt.sign(PAYLOAD, 'segredo-do-atacante');

    const erro = executar(authenticate, comToken(forjado));

    expect(erro?.status).toBe(401);
  });

  it('recusa token expirado', () => {
    const expirado = jwt.sign(PAYLOAD, env.jwt.secret, { expiresIn: '-1s' });

    const erro = executar(authenticate, comToken(expirado));

    expect(erro?.status).toBe(401);
  });

  it('recusa token válido cujo conteúdo não é um payload de autenticação', () => {
    const semTenant = jwt.sign({ sub: PAYLOAD.sub }, env.jwt.secret);

    const erro = executar(authenticate, comToken(semTenant));

    expect(erro?.status).toBe(401);
  });

  it('aceita token válido e anexa o usuário à requisição', () => {
    const req = comToken(tokenService.sign(PAYLOAD));

    const erro = executar(authenticate, req);

    expect(erro).toBeNull();
    expect(req.usuario).toEqual(PAYLOAD);
  });
});

describe('authorize — H2.3 (perfis)', () => {
  it('nega a quem não tem o papel exigido', () => {
    const erro = executar(authorize('ADMIN'), requisicao({ usuario: PAYLOAD }));

    expect(erro?.status).toBe(403);
  });

  it('permite a quem tem o papel exigido', () => {
    const erro = executar(
      authorize('ADMIN'),
      requisicao({ usuario: { ...PAYLOAD, papel: 'ADMIN' } }),
    );

    expect(erro).toBeNull();
  });

  it('aceita qualquer um dos papéis listados', () => {
    const handler = authorize('ADMIN', 'OPERADOR');

    expect(executar(handler, requisicao({ usuario: PAYLOAD }))).toBeNull();
    expect(executar(handler, requisicao({ usuario: { ...PAYLOAD, papel: 'ADMIN' } }))).toBeNull();
  });

  it('sem usuário autenticado, responde 401 e não 403', () => {
    const erro = executar(authorize('ADMIN'), requisicao());

    expect(erro?.status).toBe(401);
  });
});

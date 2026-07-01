import type { RequestHandler } from 'express';
import type { LoginData, RegisterData } from '../domain/entities/Usuario.js';
import { UnauthorizedError } from '../domain/errors/AppError.js';
import { authService } from '../infrastructure/di/container.js';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as RegisterData;
    const result = await authService.register(body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as LoginData;
    const result = await authService.login(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.usuario) {
      throw new UnauthorizedError('Não autenticado.');
    }
    const usuario = await authService.getById(req.usuario.sub);
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

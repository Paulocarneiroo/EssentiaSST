import type { RequestHandler } from 'express';
import { checkHealth } from '../services/healthService.js';

export const getHealth: RequestHandler = async (_req, res, next) => {
  try {
    const status = await checkHealth();
    res.status(status.database ? 200 : 503).json(status);
  } catch (error) {
    next(error);
  }
};

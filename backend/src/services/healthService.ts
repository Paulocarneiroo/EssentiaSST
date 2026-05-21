import { ping } from '../database/pool.js';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  database: boolean;
  timestamp: string;
}

export const checkHealth = async (): Promise<HealthStatus> => {
  let database = false;
  try {
    database = await ping();
  } catch {
    database = false;
  }
  return {
    status: database ? 'ok' : 'degraded',
    uptime: process.uptime(),
    database,
    timestamp: new Date().toISOString(),
  };
};

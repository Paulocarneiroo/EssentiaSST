import { pool } from '../../database/pool.js';
import { logger } from '../../utils/logger.js';
import { migration001EmpresasColaboradores } from './migrations/001_empresas_colaboradores.js';

export const runMigrations = async (): Promise<void> => {
  await pool.query(migration001EmpresasColaboradores);
  logger.info('Migrations aplicadas com sucesso.');
};

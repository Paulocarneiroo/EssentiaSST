import pg from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[],
): Promise<QueryResult<T>> => pool.query<T>(text, params as unknown[] | undefined);

export const ping = async (): Promise<boolean> => {
  const { rows } = await pool.query<{ ok: number }>('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
};

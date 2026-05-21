import 'dotenv/config';

const required = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }
  return value;
};

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppEnv {
  nodeEnv: string;
  port: number;
  db: DatabaseConfig;
  jwt: JwtConfig;
}

export const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),

  db: {
    host: required('DB_HOST'),
    port: Number(required('DB_PORT')),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
};

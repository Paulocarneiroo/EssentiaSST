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

export type AmbienteESocialConfig = 'PRODUCAO' | 'PRODUCAO_RESTRITA';
export type ClienteESocialConfig = 'sandbox' | 'govbr';

export interface ESocialConfig {
  /** Destino do envio (`tpAmb`): produção ou produção restrita (homologação). */
  ambiente: AmbienteESocialConfig;
  /** Implementação de `IClienteESocial` a injetar. */
  cliente: ClienteESocialConfig;
  /** Proporção de rejeições simuladas pelo sandbox, entre 0 e 1. */
  taxaRejeicaoSandbox: number;
}

export interface AppEnv {
  nodeEnv: string;
  /** Interface de rede onde o servidor escuta. `0.0.0.0` aceita conexões da LAN. */
  host: string;
  port: number;
  db: DatabaseConfig;
  jwt: JwtConfig;
  esocial: ESocialConfig;
}

const parseAmbiente = (value: string | undefined): AmbienteESocialConfig => {
  if (value === undefined || value === '') {
    // Padrão seguro: nunca gerar obrigação real sem escolha explícita (H3.5).
    return 'PRODUCAO_RESTRITA';
  }
  if (value !== 'PRODUCAO' && value !== 'PRODUCAO_RESTRITA') {
    throw new Error(
      `ESOCIAL_AMBIENTE inválido: "${value}". Use PRODUCAO ou PRODUCAO_RESTRITA.`,
    );
  }
  return value;
};

const parseCliente = (value: string | undefined): ClienteESocialConfig => {
  if (value === undefined || value === '') {
    return 'sandbox';
  }
  if (value !== 'sandbox' && value !== 'govbr') {
    throw new Error(`ESOCIAL_CLIENTE inválido: "${value}". Use sandbox ou govbr.`);
  }
  return value;
};

const parseTaxa = (value: string | undefined): number => {
  if (value === undefined || value === '') {
    return 0;
  }
  const taxa = Number(value);
  if (!Number.isFinite(taxa) || taxa < 0 || taxa > 1) {
    throw new Error(`ESOCIAL_TAXA_REJEICAO inválida: "${value}". Use um número entre 0 e 1.`);
  }
  return taxa;
};

export const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '0.0.0.0',
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

  esocial: {
    ambiente: parseAmbiente(process.env.ESOCIAL_AMBIENTE),
    cliente: parseCliente(process.env.ESOCIAL_CLIENTE),
    taxaRejeicaoSandbox: parseTaxa(process.env.ESOCIAL_TAXA_REJEICAO),
  },
};

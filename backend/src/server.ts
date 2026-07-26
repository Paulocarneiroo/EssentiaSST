import express from 'express';
import { networkInterfaces } from 'node:os';
import { env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { prisma } from './infrastructure/database/prisma.js';
import { logger } from './utils/logger.js';

const app = express();

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  next();
});

app.options('*', (_req, res) => {
  res.sendStatus(204);
});

app.use(express.json());

setupSwagger(app);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

/** IPv4 das interfaces de rede não-loopback — os endereços alcançáveis pela LAN. */
const enderecosLan = (): string[] =>
  Object.values(networkInterfaces())
    .flatMap((ifaces) => ifaces ?? [])
    .filter((iface) => iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);

const bootstrap = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Conexão com o banco (Prisma) estabelecida.');
  } catch (error) {
    logger.error('Falha ao conectar no banco de dados.', error);
    process.exit(1);
  }

  const server = app.listen(env.port, env.host, () => {
    logger.info(`EssentiaSST API ouvindo em ${env.host}:${env.port} (${env.nodeEnv})`);
    logger.info(`  local:   http://localhost:${env.port}/api/docs`);

    if (env.host === '0.0.0.0') {
      for (const ip of enderecosLan()) {
        logger.info(`  na rede: http://${ip}:${env.port}/api/docs`);
      }
    }
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Recebido ${signal}, encerrando...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

void bootstrap();

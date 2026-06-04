import express from 'express';
import { env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { runMigrations } from './infrastructure/database/migrate.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(express.json());

setupSwagger(app);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const bootstrap = async (): Promise<void> => {
  try {
    await runMigrations();
  } catch (error) {
    logger.error('Falha ao aplicar migrations.', error);
    process.exit(1);
  }

  app.listen(env.port, () => {
    logger.info(`EssentiaSST API ouvindo em http://localhost:${env.port} (${env.nodeEnv})`);
    logger.info(`Swagger UI: http://localhost:${env.port}/api/docs`);
  });
};

void bootstrap();

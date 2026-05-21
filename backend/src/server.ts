import express from 'express';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(express.json());

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`EssentiaSST API ouvindo em http://localhost:${env.port} (${env.nodeEnv})`);
});

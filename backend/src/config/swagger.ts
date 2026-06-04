import type { Express, RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi.js';

export const setupSwagger = (app: Express): void => {
  const serve = swaggerUi.serve as RequestHandler[];
  const setup = swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'EssentiaSST API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }) as RequestHandler;

  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  app.use('/api/docs', ...serve, setup);
};

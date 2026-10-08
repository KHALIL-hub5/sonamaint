import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { authenticate, createTokenVerifier } from './middleware/auth/index.js';
import type { TokenVerifier } from './middleware/auth/types.js';
import { errorHandler } from './middleware/error-handler.js';
import { buildingsRouter } from './modules/buildings/routes.js';
import { interventionClassesRouter } from './modules/intervention-classes/routes.js';
import { officesRouter } from './modules/offices/routes.js';
import { pcsRouter } from './modules/pcs/routes.js';

export function createApp(verifier: TokenVerifier = createTokenVerifier()) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(pinoHttp({ redact: ['req.headers.authorization'] }));

  app.get('/api/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use('/api', authenticate(verifier));
  app.use('/api/buildings', buildingsRouter);
  app.use('/api/offices', officesRouter);
  app.use('/api/intervention-classes', interventionClassesRouter);
  app.use('/api/pcs', pcsRouter);

  app.use(errorHandler);

  return app;
}

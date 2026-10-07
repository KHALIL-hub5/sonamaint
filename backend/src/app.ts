import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { authenticate, createTokenVerifier } from './middleware/auth/index.js';
import type { TokenVerifier } from './middleware/auth/types.js';
import { errorHandler } from './middleware/error-handler.js';

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

  app.use(errorHandler);

  return app;
}

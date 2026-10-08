import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { authenticate, createTokenVerifier } from './middleware/auth/index.js';
import type { TokenVerifier } from './middleware/auth/types.js';
import { errorHandler } from './middleware/error-handler.js';
import { openApiDocument } from './openapi.js';
import { AppError } from './utils/app-error.js';
import { attachmentsRouter } from './modules/attachments/routes.js';
import { buildingsRouter } from './modules/buildings/routes.js';
import { dashboardRouter } from './modules/dashboard/routes.js';
import { interventionClassesRouter } from './modules/intervention-classes/routes.js';
import { interventionsRouter, pcInterventionsRouter } from './modules/interventions/routes.js';
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

  app.use(
    '/api',
    rateLimit({
      windowMs: env.API_RATE_LIMIT_WINDOW_MS,
      limit: env.API_RATE_LIMIT_MAX,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_request, response) => {
        response.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many API requests; try again later',
          },
        });
      },
    }),
  );
  app.use('/api', authenticate(verifier));
  if (env.ENABLE_DOCS) {
    app.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(openApiDocument, {
        swaggerOptions: { persistAuthorization: true },
      }),
    );
  }
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/buildings', buildingsRouter);
  app.use('/api/offices', officesRouter);
  app.use('/api/intervention-classes', interventionClassesRouter);
  app.use('/api/interventions', interventionsRouter);
  app.use('/api/attachments', attachmentsRouter);
  app.use('/api/pcs', pcInterventionsRouter);
  app.use('/api/pcs', pcsRouter);

  app.use((_request, _response, next) => {
    next(new AppError(404, 'NOT_FOUND', 'Route not found'));
  });
  app.use(errorHandler);

  return app;
}

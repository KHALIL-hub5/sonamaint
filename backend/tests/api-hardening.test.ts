import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { openApiDocument } from '../src/openapi.js';

describe('API hardening', () => {
  afterEach(() => {
    env.ENABLE_DOCS = false;
    env.API_RATE_LIMIT_MAX = 1_000;
  });

  it('documents every registered API route with a Bearer security scheme', () => {
    expect(Object.keys(openApiDocument.paths)).toEqual(
      expect.arrayContaining([
        '/api/health',
        '/api/dashboard/stats',
        '/api/buildings',
        '/api/offices',
        '/api/intervention-classes',
        '/api/pcs',
        '/api/pcs/{id}',
        '/api/pcs/{id}/history',
        '/api/pcs/{id}/interventions',
        '/api/interventions',
        '/api/interventions/recent',
        '/api/interventions/{id}',
        '/api/interventions/{id}/attachments',
        '/api/attachments/{id}/file',
      ]),
    );
    expect(openApiDocument.components?.securitySchemes).toHaveProperty('BearerAuth');
    expect(openApiDocument.paths['/api/pcs']?.get?.parameters).toBeDefined();
  });

  it('serves Swagger UI when documentation is enabled', async () => {
    env.ENABLE_DOCS = true;
    const response = await request(createApp()).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });

  it('returns 404 for an unknown API route', async () => {
    const response = await request(createApp()).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns INVALID_JSON for a malformed JSON body', async () => {
    const response = await request(createApp())
      .post('/api/pcs')
      .set('Content-Type', 'application/json')
      .send('{"assetTag":');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_JSON' });
  });

  it.each([
    ['23505', 409, 'UNIQUE_VIOLATION'],
    ['23503', 409, 'FOREIGN_KEY_VIOLATION'],
    ['23514', 400, 'CHECK_VIOLATION'],
  ])('maps PostgreSQL error %s safely', async (postgresCode, status, errorCode) => {
    const app = express();
    app.get('/database-error', (_request, _response, next) => {
      next(Object.assign(new Error('SQL text must not be exposed'), { code: postgresCode }));
    });
    app.use(errorHandler);

    const response = await request(app).get('/database-error');

    expect(response.status).toBe(status);
    expect(response.body.error.code).toBe(errorCode);
    expect(JSON.stringify(response.body)).not.toContain('SQL text');
  });

  it('does not expose unexpected error messages or stacks', async () => {
    const app = express();
    app.get('/unexpected-error', (_request, _response, next) => {
      next(new Error('SELECT secret_data FROM private_table'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/unexpected-error');
    const responseBody = JSON.stringify(response.body);

    expect(response.status).toBe(500);
    expect(responseBody).not.toContain('secret_data');
    expect(responseBody).not.toContain('Error:');
  });

  it('uses the configured API request limit', async () => {
    env.API_RATE_LIMIT_MAX = 1;
    const app = createApp();

    const firstResponse = await request(app).get('/api/does-not-exist');
    const secondResponse = await request(app).get('/api/does-not-exist');

    expect(firstResponse.status).toBe(404);
    expect(secondResponse.status).toBe(429);
    expect(secondResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

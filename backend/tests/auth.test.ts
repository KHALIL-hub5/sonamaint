import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
} from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { JwtTokenVerifier } from '../src/middleware/auth/jwt-verifier.js';

describe('authentication middleware', () => {
  let jwksServer: Server;
  let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
  let jwksUrl: string;
  const issuer = 'http://auth.test/issuer';
  const audience = 'sonamaint-api';
  const keyId = 'sonamaint-test-key';

  beforeAll(async () => {
    const keyPair = await generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    const publicJwk = await exportJWK(keyPair.publicKey);
    const jwk: JWK = { ...publicJwk, alg: 'RS256', kid: keyId, use: 'sig' };

    jwksServer = createServer((_request, response) => {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ keys: [jwk] }));
    });

    await new Promise<void>((resolve) => {
      jwksServer.listen(0, '127.0.0.1', resolve);
    });

    const address = jwksServer.address() as AddressInfo;
    jwksUrl = `http://127.0.0.1:${address.port}/.well-known/jwks.json`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      jwksServer.close((error) => (error ? reject(error) : resolve()));
    });
  });

  function app() {
    return createApp(new JwtTokenVerifier({ jwksUrl, issuer, audience }));
  }

  async function token(overrides: { issuer?: string; expiration?: number } = {}) {
    return new SignJWT({ name: 'Test Engineer' })
      .setProtectedHeader({ alg: 'RS256', kid: keyId, typ: 'JWT' })
      .setSubject('user-123')
      .setIssuer(overrides.issuer ?? issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(overrides.expiration ?? Math.floor(Date.now() / 1000) + 3_600)
      .sign(privateKey);
  }

  it('accepts a valid JWT', async () => {
    const response = await request(app())
      .get('/api/protected')
      .set('Authorization', `Bearer ${await token()}`);

    expect(response.status).toBe(404);
  });

  it('rejects an expired JWT', async () => {
    const response = await request(app())
      .get('/api/protected')
      .set('Authorization', `Bearer ${await token({ expiration: Math.floor(Date.now() / 1000) - 60 })}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('rejects a JWT with the wrong issuer', async () => {
    const response = await request(app())
      .get('/api/protected')
      .set('Authorization', `Bearer ${await token({ issuer: 'http://wrong-issuer.test' })}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('rejects a missing token on a non-health API route', async () => {
    const response = await request(app()).get('/api/protected');

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('keeps the health endpoint public', async () => {
    const response = await request(app()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

import { env } from '../../config/env.js';
import { DevTokenVerifier } from './dev-verifier.js';
import { JwtTokenVerifier } from './jwt-verifier.js';
import type { TokenVerifier } from './types.js';

export function createTokenVerifier(): TokenVerifier {
  if (env.AUTH_MODE === 'dev') {
    return new DevTokenVerifier({
      id: env.DEV_USER_ID,
      name: env.DEV_USER_NAME,
    });
  }

  return new JwtTokenVerifier({
    jwksUrl: env.AUTH_JWKS_URL!,
    issuer: env.AUTH_ISSUER!,
    audience: env.AUTH_AUDIENCE!,
  });
}

export { authenticate } from './authenticate.js';
export { DevTokenVerifier } from './dev-verifier.js';
export { JwtTokenVerifier } from './jwt-verifier.js';
export type {
  AuthenticatedUser,
  TokenVerifier,
} from './types.js';

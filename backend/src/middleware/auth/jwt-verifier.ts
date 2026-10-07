import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AppError } from '../../utils/app-error.js';
import type { AuthenticatedUser, TokenVerifier } from './types.js';

export interface JwtVerifierOptions {
  jwksUrl: string;
  issuer: string;
  audience: string;
}

export class JwtTokenVerifier implements TokenVerifier {
  private readonly jwks;

  public constructor(private readonly options: JwtVerifierOptions) {
    this.jwks = createRemoteJWKSet(new URL(options.jwksUrl));
  }

  public async verify(request: Request): Promise<AuthenticatedUser> {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHENTICATED', 'A bearer token is required');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError(401, 'UNAUTHENTICATED', 'A bearer token is required');
    }

    try {
      // TODO: Adjust this adapter to the claims and signing conventions of the real auth system.
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.options.issuer,
        audience: this.options.audience,
      });

      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new AppError(401, 'UNAUTHENTICATED', 'The bearer token has no subject');
      }

      return {
        id: payload.sub,
        ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(401, 'UNAUTHENTICATED', 'The bearer token is invalid');
    }
  }
}

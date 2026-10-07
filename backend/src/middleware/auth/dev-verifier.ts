import type { Request } from 'express';
import type { AuthenticatedUser, TokenVerifier } from './types.js';

export class DevTokenVerifier implements TokenVerifier {
  public constructor(private readonly user: AuthenticatedUser) {}

  public async verify(_request: Request): Promise<AuthenticatedUser> {
    return this.user;
  }
}

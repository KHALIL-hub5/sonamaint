import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  name?: string;
}

export interface TokenVerifier {
  verify(request: Request): Promise<AuthenticatedUser>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

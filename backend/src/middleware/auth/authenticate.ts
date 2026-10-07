import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/app-error.js';
import type { TokenVerifier } from './types.js';

export function authenticate(verifier: TokenVerifier) {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    try {
      request.user = await verifier.verify(request);
      next();
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError(401, 'UNAUTHENTICATED', 'Authentication failed'),
      );
    }
  };
}

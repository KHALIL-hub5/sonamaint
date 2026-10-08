import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues,
      },
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    response.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains malformed JSON',
      },
    });
    return;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const postgresCode = error.code;
    const postgresErrors: Record<string, { status: number; code: string; message: string }> = {
      '23505': {
        status: 409,
        code: 'UNIQUE_VIOLATION',
        message: 'A record with the provided value already exists',
      },
      '23503': {
        status: 409,
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'The request references a record that does not exist',
      },
      '23514': {
        status: 400,
        code: 'CHECK_VIOLATION',
        message: 'The request violates a data constraint',
      },
    };

    const mapped =
      typeof postgresCode === 'string' ? postgresErrors[postgresCode] : undefined;
    if (mapped) {
      response.status(mapped.status).json({
        error: { code: mapped.code, message: mapped.message },
      });
      return;
    }
  }

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

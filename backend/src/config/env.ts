import 'dotenv/config';
import { z } from 'zod';

const rawEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a PostgreSQL connection URL'),
  TEST_DATABASE_URL: z.string().url('TEST_DATABASE_URL must be a PostgreSQL connection URL'),
  DB_POOL_MAX: z.coerce.number().int().positive().max(100).default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  UPLOAD_DIR: z.string().min(1).default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(1_024).default(10),
  AUTH_MODE: z.enum(['dev', 'jwt']).default('dev'),
  AUTH_JWKS_URL: z.string().url().optional().or(z.literal('')),
  AUTH_ISSUER: z.string().min(1).optional().or(z.literal('')),
  AUTH_AUDIENCE: z.string().min(1).optional().or(z.literal('')),
  DEV_USER_ID: z.string().min(1).default('dev-user'),
  DEV_USER_NAME: z.string().min(1).default('Development User'),
});

const parsed = rawEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

const values = parsed.data;

if (values.AUTH_MODE === 'jwt') {
  const jwtValues = z
    .object({
      AUTH_JWKS_URL: z.string().url(),
      AUTH_ISSUER: z.string().min(1),
      AUTH_AUDIENCE: z.string().min(1),
    })
    .safeParse(values);

  if (!jwtValues.success) {
    const issues = jwtValues.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid JWT authentication configuration: ${issues}`);
  }
}

if (values.NODE_ENV === 'production' && values.AUTH_MODE === 'dev') {
  throw new Error('Invalid authentication configuration: AUTH_MODE=dev is not allowed in production');
}

export const env = values;

export type Env = typeof env;

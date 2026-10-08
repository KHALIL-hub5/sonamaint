# SonaMaint backend

The SonaMaint backend is a Node.js, TypeScript and Express API for the Sonatrach research laboratory's local maintenance application.

## Requirements

- Node.js LTS (Node 20 or newer)
- PostgreSQL

## Setup

From this directory:

```sh
npm install
Copy-Item .env.example .env
```

Edit `.env` with the PostgreSQL connection string and local settings. `AUTH_MODE=dev` injects the configured development user and is only allowed outside production. Use `AUTH_MODE=jwt` with the JWKS, issuer and audience settings when connecting the external identity provider.

`DATABASE_URL` and `TEST_DATABASE_URL` use PostgreSQL URLs. URL-encode passwords that contain special characters. The pool defaults to a maximum of 10 connections and a 30-second idle timeout.

Run the development server:

```sh
npm run dev
```

The public health check is available at `GET http://localhost:3000/api/health`. All other API routes are under `/api` and require authentication.

`GET /api/dashboard/stats` returns PC, intervention, and office summary counts. Month-to-date values use the `Africa/Algiers` calendar month.

## API documentation and limits

When enabled, the interactive OpenAPI 3 / Swagger UI is available at `GET /api/docs`. It includes a Bearer-token Authorize control. `ENABLE_DOCS` defaults to enabled in development and disabled in production; set it to `true` or `false` to override that behavior.

Requests under `/api` are rate-limited (except the public health check). Defaults are 1,000 requests per 15 minutes; configure these with `API_RATE_LIMIT_MAX` and `API_RATE_LIMIT_WINDOW_MS`.

Malformed JSON returns `400 INVALID_JSON`, and unknown routes return `404 NOT_FOUND`. PostgreSQL unique and foreign-key violations map to 409, while check violations map to 400. Unexpected server errors do not expose SQL or stack traces.

## Photo attachments

- `POST /api/interventions/:id/attachments` accepts 1–5 image files in the `files` multipart field and an optional JSON-array `captions` field. Only JPEG, PNG and WebP are accepted, and each file is limited to `MAX_UPLOAD_MB`.
- `GET /api/attachments/:id/file` streams an uploaded image inline.

Files are stored beneath `UPLOAD_DIR` using generated names; the original client filename is not used for storage.

## Verification

```sh
npm run build
npm run lint
npm test
npm run db:check
```

`db:check` verifies that the seven schema tables are present in the database configured by `DATABASE_URL`.

Reference-data integration tests use a dedicated PostgreSQL database whose name ends in `_test`. The safety guard requires `DATABASE_URL` and `TEST_DATABASE_URL` to point to the same `_test` database; the truncate helper refuses any other target. The development database must never be used for these tests.

```powershell
Copy-Item .env.test.example .env.test
# Edit .env.test and replace the password placeholder with the test database password.
# Passwords with special characters must be URL-encoded.
npm test
```

The example sets `RUN_DB_TESTS=true`. If `.env.test` is absent, the database tests remain skipped and the test setup prints a message explaining how to configure them.

## Architecture

Feature modules belong under `src/modules/<feature>/` and should contain `routes.ts`, `controller.ts`, `service.ts`, `repository.ts`, and `schemas.ts` as needed. Keep the dependency flow as routes → controller → service → repository; repositories are the only layer allowed to contain SQL.

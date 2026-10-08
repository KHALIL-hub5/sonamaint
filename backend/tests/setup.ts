import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { assertSafeTestDatabaseUrls } from './helpers/database-safety.js';

const testEnvPath = fileURLToPath(new URL('../.env.test', import.meta.url));

if (existsSync(testEnvPath)) {
  const result = config({ path: testEnvPath, override: true });
  if (result.error) {
    throw new Error(`Unable to load ${testEnvPath}: ${result.error.message}`);
  }

  assertSafeTestDatabaseUrls(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
} else {
  delete process.env.RUN_DB_TESTS;
  console.warn(
    'Database integration tests are disabled because backend/.env.test is missing. Copy backend/.env.test.example to backend/.env.test to configure them.',
  );
}

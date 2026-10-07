import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { pool } from './pool.js';

const expectedTables = [
  'building',
  'office',
  'pc',
  'intervention_class',
  'intervention',
  'attachment',
  'pc_change_log',
] as const;

function databaseTarget(connectionString: string): {
  host: string;
  port: string;
  database: string;
} {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: url.port || '5432',
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
  };
}

async function main(): Promise<void> {
  try {
    const result = await pool.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [expectedTables],
    );
    const found = new Set(result.rows.map((row) => row.table_name));
    const missing = expectedTables.filter((table) => !found.has(table));

    if (missing.length > 0) {
      logger.error({ missing }, 'Database schema is missing expected tables');
      process.exitCode = 1;
      return;
    }

    logger.info({ tables: expectedTables }, 'Database connection and schema check passed');
  } catch (error) {
    const target = databaseTarget(env.DATABASE_URL);
    logger.error(
      { err: error, ...target },
      'Database check failed; verify DATABASE_URL and that the schema has been applied',
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();

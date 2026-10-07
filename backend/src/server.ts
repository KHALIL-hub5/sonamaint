import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './db/pool.js';

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

async function start(): Promise<void> {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    logger.error(
      { err: error, ...databaseTarget(env.DATABASE_URL) },
      'Database startup check failed; refusing to start the server',
    );
    await pool.end();
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'SonaMaint API listening');
  });
}

void start();

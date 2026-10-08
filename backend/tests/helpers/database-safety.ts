interface DatabaseTarget {
  host: string;
  hostaddr: string;
  port: string;
  name: string;
}

function parseTestDatabaseTarget(key: string, value: string): DatabaseTarget {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid PostgreSQL connection URL.`);
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error(`${key} must use the postgres:// or postgresql:// protocol.`);
  }

  let name: string;
  try {
    name = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  } catch {
    throw new Error(`${key} contains an invalid encoded database name.`);
  }

  if (!name.endsWith('_test')) {
    throw new Error(
      `${key} must target a database whose name ends in "_test"; refusing unsafe database "${name}".`,
    );
  }

  return {
    host: (url.searchParams.get('host') ?? url.hostname).toLowerCase(),
    hostaddr: url.searchParams.get('hostaddr') ?? '',
    port: (url.searchParams.get('port') ?? url.port) || '5432',
    name,
  };
}

export function assertSafeTestDatabaseUrls(
  databaseUrl: string | undefined,
  testDatabaseUrl: string | undefined,
): void {
  const databaseTarget = databaseUrl
    ? parseTestDatabaseTarget('DATABASE_URL', databaseUrl)
    : undefined;
  const testDatabaseTarget = testDatabaseUrl
    ? parseTestDatabaseTarget('TEST_DATABASE_URL', testDatabaseUrl)
    : undefined;

  if (
    databaseTarget &&
    testDatabaseTarget &&
    (databaseTarget.host !== testDatabaseTarget.host ||
      databaseTarget.hostaddr !== testDatabaseTarget.hostaddr ||
      databaseTarget.port !== testDatabaseTarget.port ||
      databaseTarget.name !== testDatabaseTarget.name)
  ) {
    throw new Error(
      'DATABASE_URL and TEST_DATABASE_URL must point to the same _test database.',
    );
  }
}

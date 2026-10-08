import { describe, expect, it } from 'vitest';
import { assertSafeTestDatabaseUrls } from './database-safety.js';

describe('test database safety', () => {
  const testUrl = 'postgresql://postgres:example@localhost:5432/sonamaint_test';

  it('allows matching test database URLs', () => {
    expect(() => assertSafeTestDatabaseUrls(testUrl, testUrl)).not.toThrow();
  });

  it('rejects database names without the _test suffix', () => {
    const developmentUrl = 'postgresql://postgres:example@localhost:5432/sonamaint';

    expect(() => assertSafeTestDatabaseUrls(developmentUrl, developmentUrl)).toThrow(
      'must target a database whose name ends in "_test"',
    );
  });

  it('rejects URLs pointing to different databases', () => {
    const differentDatabaseUrl = 'postgresql://postgres:example@localhost:5432/other_test';

    expect(() => assertSafeTestDatabaseUrls(testUrl, differentDatabaseUrl)).toThrow(
      'must point to the same _test database',
    );
  });

  it('rejects different hosts configured as URL query parameters', () => {
    const firstUrl = 'postgresql://postgres:example@localhost/sonamaint_test?host=db-one';
    const secondUrl = 'postgresql://postgres:example@localhost/sonamaint_test?host=db-two';

    expect(() => assertSafeTestDatabaseUrls(firstUrl, secondUrl)).toThrow(
      'must point to the same _test database',
    );
  });
});

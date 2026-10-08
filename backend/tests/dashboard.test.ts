import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { DevTokenVerifier } from '../src/middleware/auth/dev-verifier.js';
import {
  seedPcTestData,
  seedReferenceData,
  testPool,
  truncateAllTables,
  type PcTestData,
  type ReferenceData,
} from './helpers/db.js';

const runDatabaseTests = process.env.RUN_DB_TESTS === 'true';
const suiteTitle = runDatabaseTests
  ? 'dashboard statistics'
  : 'dashboard statistics (skipped: configure backend/.env.test from .env.test.example)';

function app() {
  return createApp(new DevTokenVerifier({ id: 'dashboard-reader' }));
}

describe.skipIf(!runDatabaseTests)(suiteTitle, () => {
  let data: PcTestData;
  let referenceData: ReferenceData;

  beforeEach(async () => {
    await truncateAllTables();
    referenceData = await seedReferenceData();
    data = await seedPcTestData(referenceData);
  });

  it('returns dashboard counts and classifies records across the Algiers month boundary', async () => {
    const firstPcId = data.pcs.find((pc) => pc.assetTag === 'PC-DZ-01142')?.id;
    const secondPcId = data.pcs.find((pc) => pc.assetTag === 'PC-DZ-02')?.id;
    expect(firstPcId).toBeDefined();
    expect(secondPcId).toBeDefined();

    await testPool.query(
      `WITH month_bounds AS (
         SELECT date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
           AT TIME ZONE 'Africa/Algiers' AS month_start
       )
       UPDATE pc
       SET created_at = CASE
         WHEN id = $1 THEN month_bounds.month_start - INTERVAL '1 microsecond'
         WHEN id = $2 THEN month_bounds.month_start + INTERVAL '1 microsecond'
         ELSE pc.created_at
       END
       FROM month_bounds
       WHERE id IN ($1, $2)`,
      [firstPcId, secondPcId],
    );
    await testPool.query(
      `WITH month_bounds AS (
         SELECT date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
           AT TIME ZONE 'Africa/Algiers' AS month_start
       ),
       ordered_interventions AS (
         SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS ordinal
         FROM intervention
       )
       UPDATE intervention
       SET performed_at = CASE
         WHEN ordered_interventions.ordinal = 1
           THEN month_bounds.month_start - INTERVAL '1 microsecond'
         ELSE month_bounds.month_start + INTERVAL '1 microsecond'
       END
       FROM ordered_interventions
       CROSS JOIN month_bounds
       WHERE intervention.id = ordered_interventions.id`,
    );

    const response = await request(app()).get('/api/dashboard/stats');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalPcs: 3,
      registeredThisMonth: 2,
      activeIncidents: 1,
      pcsInMaintenance: 1,
      interventionsThisMonth: 1,
      officesCovered: 2,
    });
  });

  afterAll(async () => {
    await testPool.end();
  });
});

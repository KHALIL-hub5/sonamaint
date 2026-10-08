import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
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
  ? 'PC endpoints'
  : 'PC endpoints (skipped: configure backend/.env.test from .env.test.example)';

describe.skipIf(!runDatabaseTests)(suiteTitle, () => {
  let data: PcTestData;
  let referenceData: ReferenceData;

  beforeEach(async () => {
    await truncateAllTables();
    referenceData = await seedReferenceData();
    data = await seedPcTestData(referenceData);
  });

  it('searches by a case-insensitive partial asset tag', async () => {
    const response = await request(createApp()).get('/api/pcs?q=dz-011');

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { assetTag: string }) => item.assetTag)).toEqual([
      'PC-DZ-01142',
    ]);
    expect(response.body.total).toBe(1);
  });

  it('searches by office code', async () => {
    const response = await request(createApp()).get('/api/pcs?q=B-104');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items.every((item: { office: { code: string } }) =>
      item.office.code === 'B-104')).toBe(true);
  });

  it('returns no items when a search has no matches', async () => {
    const response = await request(createApp()).get('/api/pcs?q=missing');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it('filters by status and officeId', async () => {
    const response = await request(createApp()).get(
      `/api/pcs?status=operational&officeId=${data.officeId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { assetTag: string }) => item.assetTag)).toEqual([
      'PC-DZ-01142',
    ]);
    expect(response.body.total).toBe(1);
  });

  it('paginates in asset-tag order and includes the matching total', async () => {
    const firstPage = await request(createApp()).get('/api/pcs?page=1&pageSize=2');
    const secondPage = await request(createApp()).get('/api/pcs?page=2&pageSize=2');

    expect(firstPage.status).toBe(200);
    expect(firstPage.body).toMatchObject({
      items: [{ assetTag: 'PC-DZ-01142' }, { assetTag: 'PC-DZ-02' }],
      page: 1,
      pageSize: 2,
      total: 3,
    });
    expect(secondPage.body).toMatchObject({
      items: [{ assetTag: 'PC-OTHER-03' }],
      page: 2,
      pageSize: 2,
      total: 3,
    });
  });

  it('treats SQL wildcard characters in search text literally', async () => {
    const percentResponse = await request(createApp()).get('/api/pcs?q=PC%');
    const underscoreResponse = await request(createApp()).get('/api/pcs?q=PC_');

    expect(percentResponse.status).toBe(200);
    expect(percentResponse.body.items).toEqual([]);
    expect(percentResponse.body.total).toBe(0);
    expect(underscoreResponse.status).toBe(200);
    expect(underscoreResponse.body.items).toEqual([]);
    expect(underscoreResponse.body.total).toBe(0);
  });

  it('returns full PC details and intervention count', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    expect(pc).toBeDefined();

    const response = await request(createApp()).get(`/api/pcs/${pc?.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: pc?.id,
      assetTag: 'PC-DZ-01142',
      model: 'OptiPlex 7090',
      status: 'operational',
      assignedUser: 'Test User',
      cpu: 'Intel Core i7',
      gpu: 'Integrated',
      ramGb: 16,
      storageType: 'SSD',
      storageGb: 512,
      osName: 'Windows',
      osVersion: '11',
      office: {
        id: data.officeId,
        code: 'B-104',
        floor: '1',
        buildingName: 'Alpha Building',
      },
      interventionCount: 2,
    });
    expect(response.body.createdAt).toEqual(expect.any(String));
  });

  it('returns PC_NOT_FOUND for a missing PC', async () => {
    const response = await request(createApp()).get('/api/pcs/2147483647');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'PC_NOT_FOUND' });
  });

  afterAll(async () => {
    await testPool.end();
  });
});

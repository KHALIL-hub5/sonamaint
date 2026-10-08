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
  ? 'PC endpoints'
  : 'PC endpoints (skipped: configure backend/.env.test from .env.test.example)';

function app() {
  return createApp(new DevTokenVerifier({ id: 'pc-editor' }));
}

describe.skipIf(!runDatabaseTests)(suiteTitle, () => {
  let data: PcTestData;
  let referenceData: ReferenceData;

  beforeEach(async () => {
    await truncateAllTables();
    referenceData = await seedReferenceData();
    data = await seedPcTestData(referenceData);
  });

  it('searches by a case-insensitive partial asset tag', async () => {
    const response = await request(app()).get('/api/pcs?q=dz-011');

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { assetTag: string }) => item.assetTag)).toEqual([
      'PC-DZ-01142',
    ]);
    expect(response.body.total).toBe(1);
  });

  it('searches by office code', async () => {
    const response = await request(app()).get('/api/pcs?q=B-104');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items.every((item: { office: { code: string } }) =>
      item.office.code === 'B-104')).toBe(true);
  });

  it('returns no items when a search has no matches', async () => {
    const response = await request(app()).get('/api/pcs?q=missing');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it('filters by status and officeId', async () => {
    const response = await request(app()).get(
      `/api/pcs?status=operational&officeId=${data.officeId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { assetTag: string }) => item.assetTag)).toEqual([
      'PC-DZ-01142',
    ]);
    expect(response.body.total).toBe(1);
  });

  it('paginates in asset-tag order and includes the matching total', async () => {
    const firstPage = await request(app()).get('/api/pcs?page=1&pageSize=2');
    const secondPage = await request(app()).get('/api/pcs?page=2&pageSize=2');

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
    const percentResponse = await request(app()).get('/api/pcs?q=PC%');
    const underscoreResponse = await request(app()).get('/api/pcs?q=PC_');

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

    const response = await request(app()).get(`/api/pcs/${pc?.id}`);

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
    const response = await request(app()).get('/api/pcs/2147483647');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'PC_NOT_FOUND' });
  });

  it('creates a PC with trimmed fields and the default status', async () => {
    const response = await request(app())
      .post('/api/pcs')
      .send({
        assetTag: '  PC-CREATED-01  ',
        officeId: data.officeId,
        cpu: '  Intel Core i9  ',
        ramGb: 64,
        storageType: 'NVMe',
        storageGb: 2048,
        osName: '  Linux  ',
        assignedUser: '  New User  ',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      assetTag: 'PC-CREATED-01',
      status: 'operational',
      cpu: 'Intel Core i9',
      ramGb: 64,
      storageType: 'NVMe',
      storageGb: 2048,
      osName: 'Linux',
      assignedUser: 'New User',
      office: { id: data.officeId, code: 'B-104' },
      interventionCount: 0,
    });
  });

  it('rejects duplicate asset tags with PC_ALREADY_EXISTS', async () => {
    const response = await request(app())
      .post('/api/pcs')
      .send({
        assetTag: 'PC-DZ-01142',
        officeId: data.officeId,
        cpu: 'Intel Core i7',
        ramGb: 16,
        storageType: 'SSD',
        storageGb: 512,
        osName: 'Windows',
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatchObject({ code: 'PC_ALREADY_EXISTS' });
  });

  it('rejects invalid creation data and unknown offices', async () => {
    const missingRequiredResponse = await request(app()).post('/api/pcs').send({
      assetTag: 'PC-INVALID',
      officeId: data.officeId,
    });
    const invalidStatusResponse = await request(app())
      .post('/api/pcs')
      .send({
        assetTag: 'PC-INVALID',
        officeId: data.officeId,
        cpu: 'CPU',
        ramGb: 16,
        storageType: 'SSD',
        storageGb: 512,
        osName: 'OS',
        status: 'unknown',
      });
    const unknownOfficeResponse = await request(app())
      .post('/api/pcs')
      .send({
        assetTag: 'PC-INVALID',
        officeId: 2_147_483_647,
        cpu: 'CPU',
        ramGb: 16,
        storageType: 'SSD',
        storageGb: 512,
        osName: 'OS',
      });

    expect(missingRequiredResponse.status).toBe(400);
    expect(missingRequiredResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(unknownOfficeResponse.status).toBe(400);
    expect(unknownOfficeResponse.body.error.code).toBe('OFFICE_NOT_FOUND');
  });

  it('updates fields in a transaction and records the audit user and values', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    expect(pc).toBeDefined();

    const response = await request(app())
      .patch(`/api/pcs/${pc?.id}`)
      .send({ cpu: '  Intel Core i9  ', ramGb: 32 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ cpu: 'Intel Core i9', ramGb: 32 });

    const history = await request(app()).get(`/api/pcs/${pc?.id}/history`);
    expect(history.status).toBe(200);
    expect(history.body.total).toBe(2);
    expect(history.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'cpu',
          oldValue: 'Intel Core i7',
          newValue: 'Intel Core i9',
          changedByRef: 'pc-editor',
          interventionId: null,
        }),
        expect.objectContaining({
          fieldName: 'ramGb',
          oldValue: '16',
          newValue: '32',
          changedByRef: 'pc-editor',
          interventionId: null,
        }),
      ]),
    );
  });

  it('does not log fields whose values are unchanged', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    expect(pc).toBeDefined();

    const response = await request(app())
      .patch(`/api/pcs/${pc?.id}`)
      .send({ cpu: 'Intel Core i7', status: 'operational' });
    const history = await request(app()).get(`/api/pcs/${pc?.id}/history`);

    expect(response.status).toBe(200);
    expect(history.status).toBe(200);
    expect(history.body).toMatchObject({ items: [], total: 0 });
  });

  it('rejects empty patches and attempts to change assetTag', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    expect(pc).toBeDefined();

    const emptyResponse = await request(app()).patch(`/api/pcs/${pc?.id}`).send({});
    const assetTagResponse = await request(app())
      .patch(`/api/pcs/${pc?.id}`)
      .send({ assetTag: 'PC-CHANGED' });
    const unknownOfficeResponse = await request(app())
      .patch(`/api/pcs/${pc?.id}`)
      .send({ officeId: 2_147_483_647 });

    expect(emptyResponse.status).toBe(400);
    expect(emptyResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(assetTagResponse.status).toBe(400);
    expect(assetTagResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(unknownOfficeResponse.status).toBe(400);
    expect(unknownOfficeResponse.body.error.code).toBe('OFFICE_NOT_FOUND');
  });

  it('paginates history newest first', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    expect(pc).toBeDefined();

    await request(app()).patch(`/api/pcs/${pc?.id}`).send({ cpu: 'Updated CPU' });
    await request(app()).patch(`/api/pcs/${pc?.id}`).send({ ramGb: 24 });
    const firstPage = await request(app()).get(`/api/pcs/${pc?.id}/history?page=1&pageSize=1`);
    const secondPage = await request(app()).get(`/api/pcs/${pc?.id}/history?page=2&pageSize=1`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body).toMatchObject({
      items: [{ fieldName: 'ramGb', oldValue: '16', newValue: '24' }],
      page: 1,
      pageSize: 1,
      total: 2,
    });
    expect(secondPage.body).toMatchObject({
      items: [{ fieldName: 'cpu', oldValue: 'Intel Core i7', newValue: 'Updated CPU' }],
      page: 2,
      pageSize: 1,
      total: 2,
    });
  });

  afterAll(async () => {
    await testPool.end();
  });
});

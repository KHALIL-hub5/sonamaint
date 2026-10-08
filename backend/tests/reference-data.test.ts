import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import {
  seedReferenceData,
  testPool,
  truncateAllTables,
  type ReferenceData,
} from './helpers/db.js';

const runDatabaseTests = process.env.RUN_DB_TESTS === 'true';
const suiteTitle = runDatabaseTests
  ? 'reference data endpoints'
  : 'reference data endpoints (skipped: configure backend/.env.test from .env.test.example)';

describe.skipIf(!runDatabaseTests)(suiteTitle, () => {
  let data: ReferenceData;

  beforeAll(async () => {
    await truncateAllTables();
  });

  beforeEach(async () => {
    await truncateAllTables();
    data = await seedReferenceData();
  });

  afterAll(async () => {
    await testPool.end();
  });

  it('lists buildings sorted by name', async () => {
    const response = await request(createApp()).get('/api/buildings');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: data.buildings.find((building) => building.name === 'Alpha Building')?.id, name: 'Alpha Building' },
      { id: data.buildings.find((building) => building.name === 'Zeta Building')?.id, name: 'Zeta Building' },
    ]);
  });

  it('lists offices sorted by code and filters by buildingId', async () => {
    const allResponse = await request(createApp()).get('/api/offices');
    const filteredResponse = await request(createApp()).get(
      `/api/offices?buildingId=${data.offices[0]?.buildingId}`,
    );

    expect(allResponse.status).toBe(200);
    expect(allResponse.body.map((office: { code: string }) => office.code)).toEqual([
      'A-01',
      'A-02',
      'Z-01',
    ]);
    expect(filteredResponse.status).toBe(200);
    expect(filteredResponse.body).toHaveLength(2);
    expect(filteredResponse.body.every((office: { building: { id: number } }) =>
      office.building.id === data.offices[0]?.buildingId)).toBe(true);
  });

  it('lists intervention classes sorted by type and name and filters by type', async () => {
    const allResponse = await request(createApp()).get('/api/intervention-classes');
    const hardwareResponse = await request(createApp()).get('/api/intervention-classes?type=H');

    expect(allResponse.status).toBe(200);
    expect(allResponse.body.map((item: { name: string }) => item.name)).toEqual([
      'Hardware',
      'Storage',
      'Software',
    ]);
    expect(hardwareResponse.status).toBe(200);
    expect(hardwareResponse.body.every((item: { type: string }) => item.type === 'H')).toBe(true);
  });

  it('returns 400 for an invalid intervention class type', async () => {
    const response = await request(createApp()).get('/api/intervention-classes?type=X');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

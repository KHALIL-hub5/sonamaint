import pg from 'pg';
import { env } from '../../src/config/env.js';
import { assertSafeTestDatabaseUrls } from './database-safety.js';

const { Pool } = pg;

export const testPool = new Pool({
  connectionString: env.TEST_DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
});

export interface ReferenceData {
  buildings: Array<{ id: number; name: string }>;
  offices: Array<{ id: number; code: string; floor: string | null; buildingId: number }>;
  interventionClasses: Array<{ id: number; type: 'H' | 'S'; name: string }>;
}

export interface PcTestData {
  officeId: number;
  pcs: Array<{ id: number; assetTag: string; status: string }>;
}

export async function truncateAllTables(): Promise<void> {
  assertSafeTestDatabaseUrls(env.DATABASE_URL, env.TEST_DATABASE_URL);

  await testPool.query(
    `TRUNCATE TABLE
       attachment,
       pc_change_log,
       intervention,
       pc,
       intervention_class,
       office,
       building
     RESTART IDENTITY CASCADE`,
  );
}

export async function seedReferenceData(): Promise<ReferenceData> {
  const client = await testPool.connect();

  try {
    await client.query('BEGIN');
    const buildings = await client.query<{ id: number; name: string }>(
      `INSERT INTO building (name)
       VALUES ('Alpha Building'), ('Zeta Building')
       RETURNING id, name`,
    );
    const buildingByName = new Map(buildings.rows.map((building) => [building.name, building.id]));

    const offices = await client.query<{
      id: number;
      code: string;
      floor: string | null;
      building_id: number;
    }>(
      `INSERT INTO office (building_id, code, floor)
       VALUES
         ($1, 'A-02', '2'),
         ($1, 'A-01', '1'),
         ($2, 'Z-01', '1')
       RETURNING id, code, floor, building_id`,
      [buildingByName.get('Alpha Building'), buildingByName.get('Zeta Building')],
    );
    const interventionClasses = await client.query<{
      id: number;
      type: 'H' | 'S';
      name: string;
    }>(
      `INSERT INTO intervention_class (type, name)
       VALUES
         ('S', 'Software'),
         ('H', 'Hardware'),
         ('H', 'Storage')
       RETURNING id, type, name`,
    );
    await client.query('COMMIT');

    return {
      buildings: buildings.rows,
      offices: offices.rows.map((office) => ({
        id: office.id,
        code: office.code,
        floor: office.floor,
        buildingId: office.building_id,
      })),
      interventionClasses: interventionClasses.rows,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function seedPcTestData(data: ReferenceData): Promise<PcTestData> {
  const buildingId = data.buildings.find((building) => building.name === 'Alpha Building')?.id;
  const interventionClassId = data.interventionClasses.find((item) => item.type === 'H')?.id;
  const otherOfficeId = data.offices.find((office) => office.code === 'Z-01')?.id;
  if (buildingId === undefined || interventionClassId === undefined || otherOfficeId === undefined) {
    throw new Error('PC test setup requires a building, office, and intervention class');
  }

  const officeResult = await testPool.query<{ id: number }>(
    `INSERT INTO office (building_id, code, floor)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [buildingId, 'B-104', '1'],
  );
  const officeId = officeResult.rows[0]?.id;
  if (officeId === undefined) {
    throw new Error('PC test setup failed to create an office');
  }

  const pcResult = await testPool.query<{ id: number; asset_tag: string; status: string }>(
    `INSERT INTO pc (
       asset_tag, model, status, office_id, assigned_user, cpu, gpu, ram_gb,
       storage_type, storage_gb, os_name, os_version
     )
     VALUES
       ('PC-DZ-01142', 'OptiPlex 7090', 'operational', $1, 'Test User', 'Intel Core i7', 'Integrated', 16, 'SSD', 512, 'Windows', '11'),
       ('PC-DZ-02', 'OptiPlex 3080', 'in_maintenance', $1, NULL, 'Intel Core i5', NULL, 8, 'HDD', 1000, 'Windows', NULL),
       ('PC-OTHER-03', NULL, 'incident', $2, 'Another User', 'AMD Ryzen 5', NULL, 32, 'NVMe', 1024, 'Linux', 'Ubuntu 24.04')
     RETURNING id, asset_tag, status`,
    [officeId, otherOfficeId],
  );

  const firstPcId = pcResult.rows.find((pc) => pc.asset_tag === 'PC-DZ-01142')?.id;
  if (firstPcId === undefined) {
    throw new Error('PC test setup failed to create a PC');
  }

  await testPool.query(
    `INSERT INTO intervention (pc_id, class_id, performed_by_ref, problem_description)
     VALUES
       ($1, $2, 'test-user', 'First test intervention'),
       ($1, $2, 'test-user', 'Second test intervention')`,
    [firstPcId, interventionClassId],
  );

  return {
    officeId,
    pcs: pcResult.rows.map((pc) => ({
      id: pc.id,
      assetTag: pc.asset_tag,
      status: pc.status,
    })),
  };
}

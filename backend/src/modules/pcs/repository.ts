import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import type {
  CreatePcBody,
  GetPcHistoryQuery,
  ListPcsQuery,
  UpdatePcBody,
} from './schemas.js';

interface PcListRow {
  id: number;
  asset_tag: string;
  status: 'operational' | 'in_maintenance' | 'incident';
  office_id: number;
  office_code: string;
  office_floor: string | null;
  building_name: string;
}

interface PcDetailRow extends PcListRow {
  model: string | null;
  assigned_user: string | null;
  cpu: string;
  gpu: string | null;
  ram_gb: number;
  storage_type: 'SSD' | 'HDD' | 'NVMe';
  storage_gb: number;
  os_name: string;
  os_version: string | null;
  created_at: Date;
  intervention_count: number;
}

interface PcHistoryRow {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: Date;
  changed_by_ref: string | null;
  intervention_id: number | null;
}

interface PcHistoryItem {
  id: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedByRef: string | null;
  interventionId: number | null;
}

export interface PcHistoryPage {
  items: PcHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PcListItem {
  id: number;
  assetTag: string;
  status: PcListRow['status'];
  office: {
    id: number;
    code: string;
    floor: string | null;
    buildingName: string;
  };
}

export interface Pc extends PcListItem {
  model: string | null;
  assignedUser: string | null;
  cpu: string;
  gpu: string | null;
  ramGb: number;
  storageType: PcDetailRow['storage_type'];
  storageGb: number;
  osName: string;
  osVersion: string | null;
  createdAt: string;
  interventionCount: number;
}

export interface PcPage {
  items: PcListItem[];
  page: number;
  pageSize: number;
  total: number;
}

function toPcListItem(row: PcListRow): PcListItem {
  return {
    id: row.id,
    assetTag: row.asset_tag,
    status: row.status,
    office: {
      id: row.office_id,
      code: row.office_code,
      floor: row.office_floor,
      buildingName: row.building_name,
    },
  };
}

function toPc(row: PcDetailRow): Pc {
  return {
    ...toPcListItem(row),
    model: row.model,
    assignedUser: row.assigned_user,
    cpu: row.cpu,
    gpu: row.gpu,
    ramGb: row.ram_gb,
    storageType: row.storage_type,
    storageGb: row.storage_gb,
    osName: row.os_name,
    osVersion: row.os_version,
    createdAt: row.created_at.toISOString(),
    interventionCount: row.intervention_count,
  };
}

const pcDetailSql = `SELECT
  p.id,
  p.asset_tag,
  p.model,
  p.status,
  p.assigned_user,
  p.cpu,
  p.gpu,
  p.ram_gb,
  p.storage_type,
  p.storage_gb,
  p.os_name,
  p.os_version,
  p.created_at,
  o.id AS office_id,
  o.code AS office_code,
  o.floor AS office_floor,
  b.name AS building_name,
  (
    SELECT COUNT(*)::integer
    FROM intervention AS i
    WHERE i.pc_id = p.id
  ) AS intervention_count
FROM pc AS p
INNER JOIN office AS o ON o.id = p.office_id
INNER JOIN building AS b ON b.id = o.building_id
WHERE p.id = $1`;

function getSearchPattern(query: string | undefined): string | null {
  if (query === undefined || query === '') {
    return null;
  }
  return `%${query.replace(/[\\%_]/g, '\\$&')}%`;
}

export async function findPcs(query: ListPcsQuery): Promise<PcPage> {
  const searchPattern = getSearchPattern(query.q);
  const filters = [searchPattern, query.officeId ?? null, query.status ?? null] as const;
  const [rowsResult, countResult] = await Promise.all([
    pool.query<PcListRow>(
      `SELECT
         p.id,
         p.asset_tag,
         p.status,
         o.id AS office_id,
         o.code AS office_code,
         o.floor AS office_floor,
         b.name AS building_name
       FROM pc AS p
       INNER JOIN office AS o ON o.id = p.office_id
       INNER JOIN building AS b ON b.id = o.building_id
       WHERE ($1::text IS NULL OR
         p.asset_tag ILIKE $1 ESCAPE E'\\\\' OR
         o.code ILIKE $1 ESCAPE E'\\\\')
         AND ($2::integer IS NULL OR p.office_id = $2)
         AND ($3::text IS NULL OR p.status = $3)
       ORDER BY p.asset_tag ASC, p.id ASC
       LIMIT $4
       OFFSET $5`,
      [...filters, query.pageSize, (query.page - 1) * query.pageSize],
    ),
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::integer AS total
       FROM pc AS p
       INNER JOIN office AS o ON o.id = p.office_id
       WHERE ($1::text IS NULL OR
         p.asset_tag ILIKE $1 ESCAPE E'\\\\' OR
         o.code ILIKE $1 ESCAPE E'\\\\')
         AND ($2::integer IS NULL OR p.office_id = $2)
         AND ($3::text IS NULL OR p.status = $3)`,
      [...filters],
    ),
  ]);

  return {
    items: rowsResult.rows.map(toPcListItem),
    page: query.page,
    pageSize: query.pageSize,
    total: countResult.rows[0]?.total ?? 0,
  };
}

export async function findPcById(id: number): Promise<Pc | null> {
  const result = await pool.query<PcDetailRow>(pcDetailSql, [id]);

  const row = result.rows[0];
  return row ? toPc(row) : null;
}

async function findPcByIdWithClient(client: PoolClient, id: number): Promise<Pc | null> {
  const result = await client.query<PcDetailRow>(pcDetailSql, [id]);
  const row = result.rows[0];
  return row ? toPc(row) : null;
}

export async function pcExists(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query('SELECT 1 FROM pc WHERE id = $1', [id]);
  return result.rowCount !== 0;
}

export async function officeExists(client: PoolClient, officeId: number): Promise<boolean> {
  const result = await client.query('SELECT 1 FROM office WHERE id = $1', [officeId]);
  return result.rowCount !== 0;
}

export async function insertPc(client: PoolClient, pc: CreatePcBody): Promise<Pc | null> {
  const result = await client.query<{ id: number }>(
    `INSERT INTO pc (
       asset_tag,
       office_id,
       cpu,
       ram_gb,
       storage_type,
       storage_gb,
       os_name,
       model,
       gpu,
       os_version,
       assigned_user,
       status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      pc.assetTag,
      pc.officeId,
      pc.cpu,
      pc.ramGb,
      pc.storageType,
      pc.storageGb,
      pc.osName,
      pc.model ?? null,
      pc.gpu ?? null,
      pc.osVersion ?? null,
      pc.assignedUser ?? null,
      pc.status,
    ],
  );

  const id = result.rows[0]?.id;
  return id === undefined ? null : findPcByIdWithClient(client, id);
}

export async function updatePcRecord(
  client: PoolClient,
  id: number,
  pc: UpdatePcBody,
): Promise<Pc | null> {
  const result = await client.query<{ id: number }>(
    `UPDATE pc
     SET
       model = CASE WHEN $2::boolean THEN $3::varchar ELSE model END,
       status = CASE WHEN $4::boolean THEN $5::varchar ELSE status END,
       office_id = CASE WHEN $6::boolean THEN $7::integer ELSE office_id END,
       assigned_user = CASE WHEN $8::boolean THEN $9::varchar ELSE assigned_user END,
       cpu = CASE WHEN $10::boolean THEN $11::varchar ELSE cpu END,
       gpu = CASE WHEN $12::boolean THEN $13::varchar ELSE gpu END,
       ram_gb = CASE WHEN $14::boolean THEN $15::integer ELSE ram_gb END,
       storage_type = CASE WHEN $16::boolean THEN $17::varchar ELSE storage_type END,
       storage_gb = CASE WHEN $18::boolean THEN $19::integer ELSE storage_gb END,
       os_name = CASE WHEN $20::boolean THEN $21::varchar ELSE os_name END,
       os_version = CASE WHEN $22::boolean THEN $23::varchar ELSE os_version END
     WHERE id = $1
     RETURNING id`,
    [
      id,
      'model' in pc,
      pc.model ?? null,
      'status' in pc,
      pc.status ?? null,
      'officeId' in pc,
      pc.officeId ?? null,
      'assignedUser' in pc,
      pc.assignedUser ?? null,
      'cpu' in pc,
      pc.cpu ?? null,
      'gpu' in pc,
      pc.gpu ?? null,
      'ramGb' in pc,
      pc.ramGb ?? null,
      'storageType' in pc,
      pc.storageType ?? null,
      'storageGb' in pc,
      pc.storageGb ?? null,
      'osName' in pc,
      pc.osName ?? null,
      'osVersion' in pc,
      pc.osVersion ?? null,
    ],
  );

  const updatedId = result.rows[0]?.id;
  return updatedId === undefined ? null : findPcByIdWithClient(client, updatedId);
}

export async function findPcHistory(
  id: number,
  query: GetPcHistoryQuery,
): Promise<PcHistoryPage> {
  const [rowsResult, countResult] = await Promise.all([
    pool.query<PcHistoryRow>(
      `SELECT id, field_name, old_value, new_value, changed_at, changed_by_ref, intervention_id
       FROM pc_change_log
       WHERE pc_id = $1
       ORDER BY changed_at DESC, id DESC
       LIMIT $2
       OFFSET $3`,
      [id, query.pageSize, (query.page - 1) * query.pageSize],
    ),
    pool.query<{ total: number }>(
      'SELECT COUNT(*)::integer AS total FROM pc_change_log WHERE pc_id = $1',
      [id],
    ),
  ]);

  return {
    items: rowsResult.rows.map((row) => ({
      id: row.id,
      fieldName: row.field_name.replace(/_([a-z])/g, (_match, letter: string) =>
        letter.toUpperCase(),
      ),
      oldValue: row.old_value,
      newValue: row.new_value,
      changedAt: row.changed_at.toISOString(),
      changedByRef: row.changed_by_ref,
      interventionId: row.intervention_id,
    })),
    page: query.page,
    pageSize: query.pageSize,
    total: countResult.rows[0]?.total ?? 0,
  };
}

import { pool } from '../../db/pool.js';
import type { ListPcsQuery } from './schemas.js';

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
  const result = await pool.query<PcDetailRow>(
    `SELECT
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
     WHERE p.id = $1`,
    [id],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

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

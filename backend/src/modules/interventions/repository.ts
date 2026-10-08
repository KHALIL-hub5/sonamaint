import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import { updatePcRecord } from '../pcs/repository.js';
import type { CreateInterventionBody, ListPcInterventionsQuery } from './schemas.js';

interface InterventionRow {
  id: number;
  pc_id: number;
  class_id: number;
  performed_at: Date;
}

interface InterventionChangeRow {
  field_name: string;
  old_value: string | null;
  new_value: string | null;
}

export interface InterventionChange {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface CreatedIntervention {
  id: number;
  pcId: number;
  classId: number;
  performedAt: string;
  changes: InterventionChange[];
}

interface PcInterventionRow {
  id: number;
  performed_at: Date;
  class_id: number;
  class_type: 'H' | 'S';
  class_name: string;
  problem_summary: string;
  attachment_count: number;
}

interface InterventionDetailRow {
  id: number;
  pc_id: number;
  asset_tag: string;
  performed_at: Date;
  performed_by_ref: string;
  external_ticket_ref: string | null;
  class_id: number;
  class_type: 'H' | 'S';
  class_name: string;
  problem_description: string;
  solution: string | null;
}

interface AttachmentRow {
  id: number;
  caption: string | null;
  mime_type: string | null;
}

interface RecentInterventionRow {
  id: number;
  performed_at: Date;
  asset_tag: string;
  office_code: string;
  class_type: 'H' | 'S';
  class_name: string;
}

export interface PcInterventionItem {
  id: number;
  performedAt: string;
  class: { id: number; type: 'H' | 'S'; name: string };
  problemSummary: string;
  attachmentCount: number;
}

export interface PcInterventionPage {
  items: PcInterventionItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface InterventionDetail {
  id: number;
  pcId: number;
  assetTag: string;
  performedAt: string;
  performedByRef: string;
  externalTicketRef: string | null;
  class: { id: number; type: 'H' | 'S'; name: string };
  problemDescription: string;
  solution: string | null;
  attachments: Array<{
    id: number;
    caption: string | null;
    mimeType: string | null;
    url: string;
  }>;
  changes: InterventionChange[];
}

export interface RecentIntervention {
  id: number;
  performedAt: string;
  assetTag: string;
  officeCode: string;
  class: { type: 'H' | 'S'; name: string };
}

const periodIntervals: Record<ListPcInterventionsQuery['period'], string | null> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  '1y': '1 year',
  all: null,
};

function toInterventionChange(row: InterventionChangeRow): InterventionChange {
  return {
    fieldName: row.field_name.replace(/_([a-z])/g, (_match, letter: string) =>
      letter.toUpperCase(),
    ),
    oldValue: row.old_value,
    newValue: row.new_value,
  };
}

export async function findPcInterventions(
  pcId: number,
  query: ListPcInterventionsQuery,
): Promise<PcInterventionPage | null> {
  const pc = await pool.query('SELECT 1 FROM pc WHERE id = $1', [pcId]);
  if (pc.rowCount === 0) {
    return null;
  }

  const interval = periodIntervals[query.period];
  const params = [pcId, query.type ?? null, query.classId ?? null, interval];
  const totalResult = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::integer AS total
     FROM intervention i
     JOIN intervention_class ic ON ic.id = i.class_id
     WHERE i.pc_id = $1
       AND ($2::text IS NULL OR ic.type::text = $2)
       AND ($3::integer IS NULL OR i.class_id = $3)
       AND ($4::interval IS NULL OR i.performed_at >= NOW() - $4::interval)`,
    params,
  );
  const pageResult = await pool.query<PcInterventionRow>(
    `SELECT i.id,
            i.performed_at,
            ic.id AS class_id,
            ic.type AS class_type,
            ic.name AS class_name,
            LEFT(i.problem_description, 120) AS problem_summary,
            (SELECT COUNT(*)::integer
             FROM attachment a
             WHERE a.intervention_id = i.id) AS attachment_count
     FROM intervention i
     JOIN intervention_class ic ON ic.id = i.class_id
     WHERE i.pc_id = $1
       AND ($2::text IS NULL OR ic.type::text = $2)
       AND ($3::integer IS NULL OR i.class_id = $3)
       AND ($4::interval IS NULL OR i.performed_at >= NOW() - $4::interval)
     ORDER BY i.performed_at DESC, i.id DESC
     LIMIT $5 OFFSET $6`,
    [...params, query.pageSize, (query.page - 1) * query.pageSize],
  );

  return {
    items: pageResult.rows.map((row) => ({
      id: row.id,
      performedAt: row.performed_at.toISOString(),
      class: { id: row.class_id, type: row.class_type, name: row.class_name },
      problemSummary: row.problem_summary,
      attachmentCount: row.attachment_count,
    })),
    page: query.page,
    pageSize: query.pageSize,
    total: totalResult.rows[0]?.total ?? 0,
  };
}

export async function findInterventionById(
  interventionId: number,
): Promise<InterventionDetail | null> {
  const result = await pool.query<InterventionDetailRow>(
    `SELECT i.id,
            i.pc_id,
            p.asset_tag,
            i.performed_at,
            i.performed_by_ref,
            i.external_ticket_ref,
            ic.id AS class_id,
            ic.type AS class_type,
            ic.name AS class_name,
            i.problem_description,
            i.solution
     FROM intervention i
     JOIN pc p ON p.id = i.pc_id
     JOIN intervention_class ic ON ic.id = i.class_id
     WHERE i.id = $1`,
    [interventionId],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const [attachments, changes] = await Promise.all([
    pool.query<AttachmentRow>(
      `SELECT id, caption, mime_type
       FROM attachment
       WHERE intervention_id = $1
       ORDER BY id ASC`,
      [interventionId],
    ),
    pool.query<InterventionChangeRow>(
      `SELECT field_name, old_value, new_value
       FROM pc_change_log
       WHERE intervention_id = $1
       ORDER BY id ASC`,
      [interventionId],
    ),
  ]);

  return {
    id: row.id,
    pcId: row.pc_id,
    assetTag: row.asset_tag,
    performedAt: row.performed_at.toISOString(),
    performedByRef: row.performed_by_ref,
    externalTicketRef: row.external_ticket_ref,
    class: { id: row.class_id, type: row.class_type, name: row.class_name },
    problemDescription: row.problem_description,
    solution: row.solution,
    attachments: attachments.rows.map((attachment) => ({
      id: attachment.id,
      caption: attachment.caption,
      mimeType: attachment.mime_type,
      url: `/api/attachments/${attachment.id}/file`,
    })),
    changes: changes.rows.map(toInterventionChange),
  };
}

export async function findRecentInterventions(limit: number): Promise<RecentIntervention[]> {
  const result = await pool.query<RecentInterventionRow>(
    `SELECT i.id,
            i.performed_at,
            p.asset_tag,
            o.code AS office_code,
            ic.type AS class_type,
            ic.name AS class_name
     FROM intervention i
     JOIN pc p ON p.id = i.pc_id
     JOIN office o ON o.id = p.office_id
     JOIN intervention_class ic ON ic.id = i.class_id
     ORDER BY i.performed_at DESC, i.id DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    performedAt: row.performed_at.toISOString(),
    assetTag: row.asset_tag,
    officeCode: row.office_code,
    class: { type: row.class_type, name: row.class_name },
  }));
}

export async function pcExists(client: PoolClient, pcId: number): Promise<boolean> {
  const result = await client.query('SELECT 1 FROM pc WHERE id = $1', [pcId]);
  return result.rowCount !== 0;
}

export async function interventionClassExists(
  client: PoolClient,
  classId: number,
): Promise<boolean> {
  const result = await client.query(
    'SELECT 1 FROM intervention_class WHERE id = $1',
    [classId],
  );
  return result.rowCount !== 0;
}

export async function officeExists(client: PoolClient, officeId: number): Promise<boolean> {
  const result = await client.query('SELECT 1 FROM office WHERE id = $1', [officeId]);
  return result.rowCount !== 0;
}

export async function insertIntervention(
  client: PoolClient,
  body: CreateInterventionBody,
  performedByRef: string,
): Promise<InterventionRow | null> {
  const result = await client.query<InterventionRow>(
    `INSERT INTO intervention (
       pc_id,
       class_id,
       performed_by_ref,
       problem_description,
       solution,
       external_ticket_ref
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, pc_id, class_id, performed_at`,
    [
      body.pcId,
      body.classId,
      performedByRef,
      body.problemDescription,
      body.solution ?? null,
      body.externalTicketRef ?? null,
    ],
  );
  return result.rows[0] ?? null;
}

export async function updatePcForIntervention(
  client: PoolClient,
  pcId: number,
  body: CreateInterventionBody,
): Promise<void> {
  const updates = {
    ...body.pcUpdates,
    ...(body.newStatus === undefined ? {} : { status: body.newStatus }),
  };

  if (Object.keys(updates).length > 0) {
    await updatePcRecord(client, pcId, updates);
  }
}

export async function findInterventionChanges(
  client: PoolClient,
  interventionId: number,
): Promise<InterventionChange[]> {
  const result = await client.query<InterventionChangeRow>(
    `SELECT field_name, old_value, new_value
     FROM pc_change_log
     WHERE intervention_id = $1
     ORDER BY id ASC`,
    [interventionId],
  );

  return result.rows.map(toInterventionChange);
}

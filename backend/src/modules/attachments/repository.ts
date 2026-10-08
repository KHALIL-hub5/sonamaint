import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';

export interface NewAttachment {
  interventionId: number;
  filePath: string;
  caption: string | null;
  mimeType: string;
}

export interface Attachment {
  id: number;
  filePath: string;
  caption: string | null;
  mimeType: string | null;
}

interface AttachmentRow {
  id: number;
  file_path: string;
  caption: string | null;
  mime_type: string | null;
}

export async function interventionExists(
  client: PoolClient,
  interventionId: number,
): Promise<boolean> {
  const result = await client.query('SELECT 1 FROM intervention WHERE id = $1', [
    interventionId,
  ]);
  return result.rowCount !== 0;
}

export async function insertAttachment(
  client: PoolClient,
  attachment: NewAttachment,
): Promise<Attachment & { mimeType: string }> {
  const result = await client.query<AttachmentRow>(
    `INSERT INTO attachment (intervention_id, file_path, caption, mime_type)
     VALUES ($1, $2, $3, $4)
     RETURNING id, file_path, caption, mime_type`,
    [
      attachment.interventionId,
      attachment.filePath,
      attachment.caption,
      attachment.mimeType,
    ],
  );
  const row = result.rows[0];
  if (!row?.mime_type) {
    throw new Error('The attachment insert completed without returning an attachment');
  }
  return {
    id: row.id,
    filePath: row.file_path,
    caption: row.caption,
    mimeType: row.mime_type,
  };
}

export async function findAttachmentById(id: number): Promise<Attachment | null> {
  const result = await pool.query<AttachmentRow>(
    `SELECT id, file_path, caption, mime_type
     FROM attachment
     WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    filePath: row.file_path,
    caption: row.caption,
    mimeType: row.mime_type,
  };
}

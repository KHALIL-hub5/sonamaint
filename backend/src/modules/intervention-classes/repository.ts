import { pool } from '../../db/pool.js';

export interface InterventionClass {
  id: number;
  type: 'H' | 'S';
  name: string;
}

interface InterventionClassRow {
  id: number;
  type: 'H' | 'S';
  name: string;
}

export async function findInterventionClasses(
  type?: 'H' | 'S',
): Promise<InterventionClass[]> {
  const result = await pool.query<InterventionClassRow>(
    `SELECT id, type, name
     FROM intervention_class
     WHERE ($1::text IS NULL OR type = $1)
     ORDER BY type ASC, name ASC`,
    [type ?? null],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
  }));
}

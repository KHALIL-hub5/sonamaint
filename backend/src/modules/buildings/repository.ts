import { pool } from '../../db/pool.js';

export interface Building {
  id: number;
  name: string;
}

interface BuildingRow {
  id: number;
  name: string;
}

export async function findAllBuildings(): Promise<Building[]> {
  const result = await pool.query<BuildingRow>(
    `SELECT id, name
     FROM building
     ORDER BY name ASC`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

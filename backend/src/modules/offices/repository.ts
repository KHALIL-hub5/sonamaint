import { pool } from '../../db/pool.js';

export interface Office {
  id: number;
  code: string;
  floor: number;
  building: {
    id: number;
    name: string;
  };
}

interface OfficeRow {
  id: number;
  code: string;
  floor: number;
  building_id: number;
  building_name: string;
}

export async function findOffices(buildingId?: number): Promise<Office[]> {
  const result = await pool.query<OfficeRow>(
    `SELECT
       o.id,
       o.code,
       o.floor,
       b.id AS building_id,
       b.name AS building_name
     FROM office AS o
     INNER JOIN building AS b ON b.id = o.building_id
     WHERE ($1::integer IS NULL OR o.building_id = $1)
     ORDER BY o.code ASC`,
    [buildingId ?? null],
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    floor: row.floor,
    building: {
      id: row.building_id,
      name: row.building_name,
    },
  }));
}

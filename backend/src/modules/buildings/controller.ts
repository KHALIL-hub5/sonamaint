import type { Request, Response } from 'express';
import { listBuildingsQuerySchema } from './schemas.js';
import { listBuildings } from './service.js';

export async function getBuildings(request: Request, response: Response): Promise<void> {
  const query = listBuildingsQuerySchema.parse(request.query);
  const buildings = await listBuildings(query);
  response.status(200).json(buildings);
}

import type { Request, Response } from 'express';
import { listOfficesQuerySchema } from './schemas.js';
import { listOffices } from './service.js';

export async function getOffices(request: Request, response: Response): Promise<void> {
  const query = listOfficesQuerySchema.parse(request.query);
  const offices = await listOffices(query);
  response.status(200).json(offices);
}

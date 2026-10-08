import type { Request, Response } from 'express';
import { getPcById, listPcs } from './service.js';
import { getPcParamsSchema, listPcsQuerySchema } from './schemas.js';

export async function getPcs(request: Request, response: Response): Promise<void> {
  const query = listPcsQuerySchema.parse(request.query);
  const result = await listPcs(query);
  response.status(200).json(result);
}

export async function getPc(request: Request, response: Response): Promise<void> {
  const { id } = getPcParamsSchema.parse(request.params);
  const pc = await getPcById(id);
  response.status(200).json(pc);
}

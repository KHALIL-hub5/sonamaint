import type { Request, Response } from 'express';
import { listInterventionClassesQuerySchema } from './schemas.js';
import { listInterventionClasses } from './service.js';

export async function getInterventionClasses(
  request: Request,
  response: Response,
): Promise<void> {
  const query = listInterventionClassesQuerySchema.parse(request.query);
  const interventionClasses = await listInterventionClasses(query);
  response.status(200).json(interventionClasses);
}

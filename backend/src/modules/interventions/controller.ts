import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error.js';
import {
  createIntervention,
  getInterventionById,
  listPcInterventions,
  listRecentInterventions,
} from './service.js';
import {
  createInterventionBodySchema,
  getInterventionParamsSchema,
  getRecentInterventionsQuerySchema,
  listPcInterventionsParamsSchema,
  listPcInterventionsQuerySchema,
} from './schemas.js';

export async function postIntervention(
  request: Request,
  response: Response,
): Promise<void> {
  const body = createInterventionBodySchema.parse(request.body);
  const userId = request.user?.id;
  if (!userId) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
  }

  const intervention = await createIntervention(body, userId, request.user?.name);
  response.status(201).json(intervention);
}

export async function getPcInterventions(
  request: Request,
  response: Response,
): Promise<void> {
  const { id } = listPcInterventionsParamsSchema.parse(request.params);
  const query = listPcInterventionsQuerySchema.parse(request.query);
  const interventions = await listPcInterventions(id, query);
  response.status(200).json(interventions);
}

export async function getIntervention(
  request: Request,
  response: Response,
): Promise<void> {
  const { id } = getInterventionParamsSchema.parse(request.params);
  const intervention = await getInterventionById(id);
  response.status(200).json(intervention);
}

export async function getRecentInterventions(
  request: Request,
  response: Response,
): Promise<void> {
  const { limit } = getRecentInterventionsQuerySchema.parse(request.query);
  const interventions = await listRecentInterventions(limit);
  response.status(200).json(interventions);
}

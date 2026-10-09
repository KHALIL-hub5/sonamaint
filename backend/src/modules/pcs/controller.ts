import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error.js';
import {
  createPc as createPcService,
  getPcById,
  getPcHistory as getPcHistoryService,
  listPcs,
  updatePc as updatePcService,
} from './service.js';
import {
  createPcBodySchema,
  getPcHistoryQuerySchema,
  getPcParamsSchema,
  listPcsQuerySchema,
  updatePcBodySchema,
} from './schemas.js';

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

export async function createPc(request: Request, response: Response): Promise<void> {
  const body = createPcBodySchema.parse(request.body);
  const pc = await createPcService(body);
  response.status(201).json(pc);
}

export async function updatePc(request: Request, response: Response): Promise<void> {
  const { id } = getPcParamsSchema.parse(request.params);
  const body = updatePcBodySchema.parse(request.body);
  const userId = request.user?.id;
  if (!userId) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
  }

  const pc = await updatePcService(id, body, userId, request.user?.name);
  response.status(200).json(pc);
}

export async function getPcHistory(request: Request, response: Response): Promise<void> {
  const { id } = getPcParamsSchema.parse(request.params);
  const query = getPcHistoryQuerySchema.parse(request.query);
  const history = await getPcHistoryService(id, query);
  response.status(200).json(history);
}

import type { Request, Response } from 'express';
import { getDashboardStatistics } from './service.js';

export async function getDashboardStats(
  _request: Request,
  response: Response,
): Promise<void> {
  const statistics = await getDashboardStatistics();
  response.status(200).json(statistics);
}

import { Router } from 'express';
import { getDashboardStats } from './controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', getDashboardStats);

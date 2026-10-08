import { Router } from 'express';
import {
  getIntervention,
  getRecentInterventions,
  getPcInterventions,
  postIntervention,
} from './controller.js';
import { interventionAttachmentsRouter } from '../attachments/routes.js';

export const interventionsRouter = Router();
export const pcInterventionsRouter = Router();

interventionsRouter.get('/recent', getRecentInterventions);
interventionsRouter.post('/', postIntervention);
interventionsRouter.use(interventionAttachmentsRouter);
interventionsRouter.get('/:id', getIntervention);

pcInterventionsRouter.get('/:id/interventions', getPcInterventions);

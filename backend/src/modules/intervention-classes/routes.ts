import { Router } from 'express';
import { getInterventionClasses } from './controller.js';

export const interventionClassesRouter = Router();

interventionClassesRouter.get('/', getInterventionClasses);

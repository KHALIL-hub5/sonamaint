import { Router } from 'express';
import { getOffices } from './controller.js';

export const officesRouter = Router();

officesRouter.get('/', getOffices);

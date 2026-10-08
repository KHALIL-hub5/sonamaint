import { Router } from 'express';
import { getBuildings } from './controller.js';

export const buildingsRouter = Router();

buildingsRouter.get('/', getBuildings);

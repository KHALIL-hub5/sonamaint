import { Router } from 'express';
import { getPc, getPcs } from './controller.js';

export const pcsRouter = Router();

pcsRouter.get('/', getPcs);
pcsRouter.get('/:id', getPc);

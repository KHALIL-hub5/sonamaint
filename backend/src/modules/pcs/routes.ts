import { Router } from 'express';
import { createPc, getPc, getPcHistory, getPcs, updatePc } from './controller.js';

export const pcsRouter = Router();

pcsRouter.get('/', getPcs);
pcsRouter.post('/', createPc);
pcsRouter.get('/:id/history', getPcHistory);
pcsRouter.patch('/:id', updatePc);
pcsRouter.get('/:id', getPc);

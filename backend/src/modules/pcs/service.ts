import { AppError } from '../../utils/app-error.js';
import { findPcById, findPcs, type Pc, type PcPage } from './repository.js';
import type { ListPcsQuery } from './schemas.js';

export async function listPcs(query: ListPcsQuery): Promise<PcPage> {
  return findPcs(query);
}

export async function getPcById(id: number): Promise<Pc> {
  const pc = await findPcById(id);
  if (!pc) {
    throw new AppError(404, 'PC_NOT_FOUND', `PC with id ${id} was not found`);
  }
  return pc;
}

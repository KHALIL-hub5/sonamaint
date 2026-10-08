import { findAllBuildings, type Building } from './repository.js';
import type { ListBuildingsQuery } from './schemas.js';

export async function listBuildings(_query: ListBuildingsQuery): Promise<Building[]> {
  return findAllBuildings();
}
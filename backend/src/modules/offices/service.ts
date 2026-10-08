import { findOffices, type Office } from './repository.js';
import type { ListOfficesQuery } from './schemas.js';

export async function listOffices(query: ListOfficesQuery): Promise<Office[]> {
  return findOffices(query.buildingId);
}

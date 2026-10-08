import {
  findInterventionClasses,
  type InterventionClass,
} from './repository.js';
import type { ListInterventionClassesQuery } from './schemas.js';

export async function listInterventionClasses(
  query: ListInterventionClassesQuery,
): Promise<InterventionClass[]> {
  return findInterventionClasses(query.type);
}

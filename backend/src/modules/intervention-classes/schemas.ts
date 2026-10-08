import { z } from 'zod';

export const listInterventionClassesQuerySchema = z
  .object({
    type: z.enum(['H', 'S']).optional(),
  })
  .strict();

export type ListInterventionClassesQuery = z.infer<
  typeof listInterventionClassesQuerySchema
>;

import { z } from 'zod';

export const listOfficesQuerySchema = z
  .object({
    buildingId: z.coerce.number().int().positive().optional(),
  })
  .strict();

export type ListOfficesQuery = z.infer<typeof listOfficesQuerySchema>;

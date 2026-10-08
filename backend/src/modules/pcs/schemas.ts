import { z } from 'zod';

export const listPcsQuerySchema = z
  .object({
    q: z.string().optional(),
    officeId: z.coerce.number().int().positive().max(2_147_483_647).optional(),
    status: z.enum(['operational', 'in_maintenance', 'incident']).optional(),
    page: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const getPcParamsSchema = z
  .object({
    id: z.coerce.number().int().positive().max(2_147_483_647),
  })
  .strict();

export type ListPcsQuery = z.infer<typeof listPcsQuerySchema>;

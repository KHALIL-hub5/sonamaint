import { z } from 'zod';

const optionalText = z.string().trim().min(1).nullable().optional();

const pcUpdatesSchema = z
  .object({
    model: optionalText,
    officeId: z.coerce.number().int().positive().max(2_147_483_647).optional(),
    assignedUser: optionalText,
    cpu: z.string().trim().min(1).optional(),
    gpu: optionalText,
    ramGb: z.coerce.number().int().positive().optional(),
    storageType: z.enum(['SSD', 'HDD', 'NVMe']).optional(),
    storageGb: z.coerce.number().int().positive().optional(),
    osName: z.string().trim().min(1).optional(),
    osVersion: optionalText,
  })
  .strict();

export const createInterventionBodySchema = z
  .object({
    pcId: z.coerce.number().int().positive().max(2_147_483_647),
    classId: z.coerce.number().int().positive().max(2_147_483_647),
    problemDescription: z.string().trim().min(1),
    solution: optionalText,
    externalTicketRef: optionalText,
    pcUpdates: pcUpdatesSchema.optional(),
    newStatus: z.enum(['operational', 'in_maintenance', 'incident']).optional(),
  })
  .strict();

export const listPcInterventionsParamsSchema = z
  .object({
    id: z.coerce.number().int().positive().max(2_147_483_647),
  })
  .strict();

export const listPcInterventionsQuerySchema = z
  .object({
    type: z.enum(['H', 'S']).optional(),
    classId: z.coerce.number().int().positive().max(2_147_483_647).optional(),
    period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('all'),
    page: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const getInterventionParamsSchema = z
  .object({
    id: z.coerce.number().int().positive().max(2_147_483_647),
  })
  .strict();

export const getRecentInterventionsQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(50).default(10),
  })
  .strict();

export type CreateInterventionBody = z.infer<typeof createInterventionBodySchema>;
export type ListPcInterventionsQuery = z.infer<typeof listPcInterventionsQuerySchema>;

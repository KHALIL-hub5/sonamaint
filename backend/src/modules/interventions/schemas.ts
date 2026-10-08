import { z } from 'zod';

const optionalText = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength).nullable().optional();

const pcUpdatesSchema = z
  .object({
    model: optionalText(100),
    officeId: z.coerce.number().int().positive().max(2_147_483_647).optional(),
    assignedUser: optionalText(100),
    cpu: z.string().trim().min(1).max(100).optional(),
    gpu: optionalText(100),
    ramGb: z.coerce.number().int().positive().max(4096).optional(),
    storageType: z.enum(['SSD', 'HDD', 'NVMe']).optional(),
    storageGb: z.coerce.number().int().positive().max(100_000).optional(),
    osName: z.string().trim().min(1).max(50).optional(),
    osVersion: optionalText(50),
  })
  .strict();

export const createInterventionBodySchema = z
  .object({
    pcId: z.coerce.number().int().positive().max(2_147_483_647),
    classId: z.coerce.number().int().positive().max(2_147_483_647),
    problemDescription: z.string().trim().min(1),
    solution: z.string().trim().min(1).nullable().optional(),
    externalTicketRef: optionalText(100),
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

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

const optionalText = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength).nullable().optional();

export const createPcBodySchema = z
  .object({
    assetTag: z.string().trim().min(1).max(30),
    officeId: z.coerce.number().int().positive().max(2_147_483_647),
    cpu: z.string().trim().min(1).max(100),
    ramGb: z.coerce.number().int().positive().max(4096),
    storageType: z.enum(['SSD', 'HDD', 'NVMe']),
    storageGb: z.coerce.number().int().positive().max(100_000),
    osName: z.string().trim().min(1).max(50),
    model: optionalText(100),
    gpu: optionalText(100),
    osVersion: optionalText(50),
    assignedUser: optionalText(100),
    status: z.enum(['operational', 'in_maintenance', 'incident']).default('operational'),
  })
  .strict();

export const updatePcBodySchema = z
  .object({
    model: optionalText(100),
    status: z.enum(['operational', 'in_maintenance', 'incident']).optional(),
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
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one PC field must be provided',
  });

export const getPcHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type ListPcsQuery = z.infer<typeof listPcsQuerySchema>;
export type CreatePcBody = z.infer<typeof createPcBodySchema>;
export type UpdatePcBody = z.infer<typeof updatePcBodySchema>;
export type GetPcHistoryQuery = z.infer<typeof getPcHistoryQuerySchema>;

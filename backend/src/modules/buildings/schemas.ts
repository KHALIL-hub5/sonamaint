import { z } from 'zod';

export const listBuildingsQuerySchema = z.object({}).strict();

export type ListBuildingsQuery = z.infer<typeof listBuildingsQuerySchema>;

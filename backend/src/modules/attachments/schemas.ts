import { z } from 'zod';

export const attachmentParamsSchema = z
  .object({
    id: z.coerce.number().int().positive().max(2_147_483_647),
  })
  .strict();

const captionsSchema = z
  .string()
  .transform((value, context) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      context.addIssue({ code: 'custom', message: 'captions must be a JSON array of strings' });
      return z.NEVER;
    }

    const result = z.array(z.string().max(200)).safeParse(parsed);
    if (!result.success) {
      context.addIssue({ code: 'custom', message: 'captions must be a JSON array of strings' });
      return z.NEVER;
    }
    return result.data;
  })
  .optional();

export const uploadAttachmentsBodySchema = z
  .object({ captions: captionsSchema })
  .strict();

export type UploadAttachmentsBody = z.infer<typeof uploadAttachmentsBodySchema>;

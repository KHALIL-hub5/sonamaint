import { createReadStream } from 'node:fs';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { attachmentParamsSchema, uploadAttachmentsBodySchema } from './schemas.js';
import {
  getAttachmentFile,
  uploadInterventionAttachments,
} from './service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 5,
    fields: 1,
  },
}).array('files', 5);

export function parseAttachmentUpload(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  upload(request, response, (error?: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? `Each image must be at most ${env.MAX_UPLOAD_MB} MB`
          : 'Upload between 1 and 5 files using the files field';
      next(new AppError(400, 'INVALID_ATTACHMENT', message));
      return;
    }
    next(error);
  });
}

export async function postInterventionAttachments(
  request: Request,
  response: Response,
): Promise<void> {
  const { id } = attachmentParamsSchema.parse(request.params);
  const body = uploadAttachmentsBodySchema.parse(request.body);
  const files = (request.files ?? []) as Express.Multer.File[];
  const attachments = await uploadInterventionAttachments(id, files, body);
  response.status(201).json({ attachments });
}

export async function getAttachment(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = attachmentParamsSchema.parse(request.params);
  const file = await getAttachmentFile(id);
  response.type(file.mimeType);
  response.setHeader('Content-Disposition', 'inline');

  const stream = createReadStream(file.absolutePath);
  stream.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT' && !response.headersSent) {
      next(new AppError(404, 'ATTACHMENT_NOT_FOUND', `Attachment with id ${id} was not found`));
      return;
    }
    if (response.headersSent) {
      response.destroy(error);
      return;
    }
    next(error);
  });
  stream.pipe(response);
}

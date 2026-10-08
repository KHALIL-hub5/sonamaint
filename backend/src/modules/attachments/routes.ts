import { Router } from 'express';
import {
  getAttachment,
  parseAttachmentUpload,
  postInterventionAttachments,
} from './controller.js';

export const interventionAttachmentsRouter = Router();
export const attachmentsRouter = Router();

interventionAttachmentsRouter.post(
  '/:id/attachments',
  parseAttachmentUpload,
  postInterventionAttachments,
);
attachmentsRouter.get('/:id/file', getAttachment);

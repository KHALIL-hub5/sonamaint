import { randomUUID } from 'node:crypto';
import { mkdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';
import { env } from '../../config/env.js';
import { withTransaction } from '../../db/transaction.js';
import { AppError } from '../../utils/app-error.js';
import {
  findAttachmentById,
  insertAttachment,
  interventionExists,
  type Attachment,
} from './repository.js';
import type { UploadAttachmentsBody } from './schemas.js';

const allowedImageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface UploadedFile {
  buffer: Buffer;
}

export interface AttachmentResponse {
  id: number;
  caption: string | null;
  mimeType: string;
  url: string;
}

export interface DownloadableAttachment {
  absolutePath: string;
  mimeType: string;
}

async function detectImageTypes(files: UploadedFile[]): Promise<Array<{
  mimeType: string;
  extension: string;
}>> {
  const detected = await Promise.all(
    files.map((file) => fileTypeFromBuffer(file.buffer)),
  );
  return detected.map((type) => {
    const extension = type ? allowedImageExtensions[type.mime] : undefined;
    if (!type || !extension) {
      throw new AppError(
        400,
        'INVALID_ATTACHMENT',
        'Only JPEG, PNG, and WebP image files are allowed',
      );
    }
    return { mimeType: type.mime, extension };
  });
}

function toResponse(
  attachment: Attachment & { mimeType: string },
): AttachmentResponse {
  return {
    id: attachment.id,
    caption: attachment.caption,
    mimeType: attachment.mimeType,
    url: `/api/attachments/${attachment.id}/file`,
  };
}

function isWithinDirectory(directory: string, candidate: string): boolean {
  const relative = path.relative(directory, candidate);
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export async function uploadInterventionAttachments(
  interventionId: number,
  files: UploadedFile[],
  body: UploadAttachmentsBody,
): Promise<AttachmentResponse[]> {
  if (files.length < 1 || files.length > 5) {
    throw new AppError(400, 'INVALID_ATTACHMENT', 'Upload between 1 and 5 image files');
  }
  if (body.captions && body.captions.length !== files.length) {
    throw new AppError(
      400,
      'INVALID_ATTACHMENT_CAPTIONS',
      'captions must contain one string for each uploaded file',
    );
  }

  const imageTypes = await detectImageTypes(files);
  const uploadRoot = path.resolve(env.UPLOAD_DIR);
  const writtenPaths: string[] = [];

  try {
    return await withTransaction(async (client) => {
      if (!(await interventionExists(client, interventionId))) {
        throw new AppError(
          404,
          'INTERVENTION_NOT_FOUND',
          `Intervention with id ${interventionId} was not found`,
        );
      }

      const targetDirectory = path.join(uploadRoot, String(interventionId));
      await mkdir(targetDirectory, { recursive: true });
      const [realUploadRoot, realTargetDirectory] = await Promise.all([
        realpath(uploadRoot),
        realpath(targetDirectory),
      ]);
      if (!isWithinDirectory(realUploadRoot, realTargetDirectory)) {
        throw new Error('Intervention attachment directory resolves outside UPLOAD_DIR');
      }
      const created: AttachmentResponse[] = [];

      for (const [index, file] of files.entries()) {
        const imageType = imageTypes[index];
        if (!imageType) {
          throw new Error('Detected image type was not available for uploaded file');
        }
        const fileName = `${randomUUID()}.${imageType.extension}`;
        const absolutePath = path.join(realTargetDirectory, fileName);
        const relativePath = path.relative(realUploadRoot, absolutePath);
        await writeFile(absolutePath, file.buffer, { flag: 'wx' });
        writtenPaths.push(absolutePath);

        const attachment = await insertAttachment(client, {
          interventionId,
          filePath: relativePath,
          caption: body.captions?.[index] ?? null,
          mimeType: imageType.mimeType,
        });
        created.push(toResponse(attachment));
      }
      return created;
    });
  } catch (error) {
    try {
      await Promise.all(writtenPaths.map((filePath) => rm(filePath, { force: true })));
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Attachment operation failed and one or more uploaded files could not be removed',
      );
    }
    throw error;
  }
}

export async function getAttachmentFile(id: number): Promise<DownloadableAttachment> {
  const attachment = await findAttachmentById(id);
  if (!attachment) {
    throw new AppError(404, 'ATTACHMENT_NOT_FOUND', `Attachment with id ${id} was not found`);
  }

  const uploadRoot = path.resolve(env.UPLOAD_DIR);
  const candidatePath = path.resolve(uploadRoot, attachment.filePath);
  if (!isWithinDirectory(uploadRoot, candidatePath)) {
    throw new AppError(404, 'ATTACHMENT_NOT_FOUND', `Attachment with id ${id} was not found`);
  }

  let realRoot: string;
  let realFile: string;
  let fileStats: Awaited<ReturnType<typeof stat>>;
  try {
    [realRoot, realFile, fileStats] = await Promise.all([
      realpath(uploadRoot),
      realpath(candidatePath),
      stat(candidatePath),
    ]);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new AppError(
        404,
        'ATTACHMENT_NOT_FOUND',
        `Attachment with id ${id} was not found`,
      );
    }
    throw error;
  }

  if (!fileStats.isFile() || !isWithinDirectory(realRoot, realFile)) {
    throw new AppError(404, 'ATTACHMENT_NOT_FOUND', `Attachment with id ${id} was not found`);
  }

  let detectedType: Awaited<ReturnType<typeof fileTypeFromFile>>;
  try {
    detectedType = await fileTypeFromFile(realFile);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new AppError(
        404,
        'ATTACHMENT_NOT_FOUND',
        `Attachment with id ${id} was not found`,
      );
    }
    throw error;
  }
  if (!detectedType || !allowedImageExtensions[detectedType.mime]) {
    throw new AppError(404, 'ATTACHMENT_NOT_FOUND', `Attachment with id ${id} was not found`);
  }

  return {
    absolutePath: realFile,
    mimeType: detectedType.mime,
  };
}

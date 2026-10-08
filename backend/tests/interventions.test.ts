import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { DevTokenVerifier } from '../src/middleware/auth/dev-verifier.js';
import { AppError } from '../src/utils/app-error.js';
import {
  seedPcTestData,
  seedReferenceData,
  testPool,
  truncateAllTables,
  type PcTestData,
  type ReferenceData,
} from './helpers/db.js';

const runDatabaseTests = process.env.RUN_DB_TESTS === 'true';
const suiteTitle = runDatabaseTests
  ? 'intervention endpoints'
  : 'intervention endpoints (skipped: configure backend/.env.test from .env.test.example)';
const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/q2cAAAAASUVORK5CYII=',
  'base64',
);

function app() {
  return createApp(new DevTokenVerifier({ id: 'intervention-tech' }));
}

async function insertIntervention(
  pcId: number,
  classId: number,
  problemDescription: string,
  performedAt?: Date,
): Promise<number> {
  const result = await testPool.query<{ id: number }>(
    `INSERT INTO intervention (
       pc_id, class_id, performed_by_ref, problem_description, performed_at
     )
     VALUES ($1, $2, 'read-test-user', $3, COALESCE($4::timestamptz, NOW()))
     RETURNING id`,
    [pcId, classId, problemDescription, performedAt ?? null],
  );
  const id = result.rows[0]?.id;
  if (id === undefined) {
    throw new Error('Test setup failed to create an intervention');
  }
  return id;
}

describe.skipIf(!runDatabaseTests)(suiteTitle, () => {
  let data: PcTestData;
  let referenceData: ReferenceData;
  let uploadDirectory: string;
  let originalUploadDirectory: string;

  beforeAll(async () => {
    originalUploadDirectory = env.UPLOAD_DIR;
    uploadDirectory = await mkdtemp(path.join(os.tmpdir(), 'sonamaint-uploads-'));
    env.UPLOAD_DIR = uploadDirectory;
  });

  beforeEach(async () => {
    await truncateAllTables();
    referenceData = await seedReferenceData();
    data = await seedPcTestData(referenceData);
  });

  it('records a RAM upgrade with the linked intervention id', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-02');
    const classId = referenceData.interventionClasses[0]?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    const response = await request(app())
      .post('/api/interventions')
      .send({
        pcId: pc?.id,
        classId,
        problemDescription: 'Upgrade workstation memory',
        solution: 'Replaced memory modules',
        pcUpdates: { ramGb: 16 },
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      pcId: pc?.id,
      classId,
      changes: [{ fieldName: 'ramGb', oldValue: '8', newValue: '16' }],
    });
    expect(response.body.id).toEqual(expect.any(Number));
    expect(response.body.performedAt).toEqual(expect.any(String));

    const history = await testPool.query<{
      field_name: string;
      old_value: string;
      new_value: string;
      changed_by_ref: string;
      intervention_id: number;
    }>(
      `SELECT field_name, old_value, new_value, changed_by_ref, intervention_id
       FROM pc_change_log
       WHERE pc_id = $1`,
      [pc?.id],
    );
    expect(history.rows).toEqual([
      {
        field_name: 'ram_gb',
        old_value: '8',
        new_value: '16',
        changed_by_ref: 'intervention-tech',
        intervention_id: response.body.id,
      },
    ]);
  });

  it('logs a new PC status as an intervention change', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    const classId = referenceData.interventionClasses[0]?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    const response = await request(app())
      .post('/api/interventions')
      .send({
        pcId: pc?.id,
        classId,
        problemDescription: 'Report hardware failure',
        newStatus: 'incident',
      });

    expect(response.status).toBe(201);
    expect(response.body.changes).toEqual([
      { fieldName: 'status', oldValue: 'operational', newValue: 'incident' },
    ]);

    const history = await testPool.query<{ intervention_id: number }>(
      'SELECT intervention_id FROM pc_change_log WHERE pc_id = $1',
      [pc?.id],
    );
    expect(history.rows).toEqual([{ intervention_id: response.body.id }]);
  });

  it('rolls back when the intervention class does not exist', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-02');
    expect(pc).toBeDefined();

    const beforeCount = await testPool.query<{ count: number }>(
      'SELECT COUNT(*)::integer AS count FROM intervention',
    );
    const response = await request(app())
      .post('/api/interventions')
      .send({
        pcId: pc?.id,
        classId: 2_147_483_647,
        problemDescription: 'Attempt invalid intervention',
        pcUpdates: { ramGb: 16 },
      });
    const afterCount = await testPool.query<{ count: number }>(
      'SELECT COUNT(*)::integer AS count FROM intervention',
    );
    const pcState = await testPool.query<{ ram_gb: number }>(
      'SELECT ram_gb FROM pc WHERE id = $1',
      [pc?.id],
    );
    const changes = await testPool.query<{ count: number }>(
      'SELECT COUNT(*)::integer AS count FROM pc_change_log WHERE pc_id = $1',
      [pc?.id],
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INTERVENTION_CLASS_NOT_FOUND');
    expect(afterCount.rows[0]?.count).toBe(beforeCount.rows[0]?.count);
    expect(pcState.rows[0]?.ram_gb).toBe(8);
    expect(changes.rows[0]?.count).toBe(0);
  });

  it('returns 400 when problemDescription is missing', async () => {
    const pc = data.pcs[0];
    const classId = referenceData.interventionClasses[0]?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    const response = await request(app())
      .post('/api/interventions')
      .send({ pcId: pc?.id, classId });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects oversized PC update values and external ticket references', async () => {
    const pc = data.pcs[0];
    const classId = referenceData.interventionClasses[0]?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();
    const invalidFields: Array<[string, string | number]> = [
      ['model', 'M'.repeat(101)],
      ['cpu', 'C'.repeat(101)],
      ['gpu', 'G'.repeat(101)],
      ['assignedUser', 'U'.repeat(101)],
      ['osName', 'O'.repeat(51)],
      ['osVersion', 'V'.repeat(51)],
      ['ramGb', 4097],
      ['storageGb', 100_001],
    ];

    for (const [field, value] of invalidFields) {
      const response = await request(app())
        .post('/api/interventions')
        .send({
          pcId: pc?.id,
          classId,
          problemDescription: 'Check request limits',
          pcUpdates: { [field]: value },
        });

      expect(response.status, `pcUpdates.${field}`).toBe(400);
      expect(response.body.error.code, `pcUpdates.${field}`).toBe('VALIDATION_ERROR');
    }

    const ticketResponse = await request(app())
      .post('/api/interventions')
      .send({
        pcId: pc?.id,
        classId,
        problemDescription: 'Check ticket reference limit',
        externalTicketRef: 'T'.repeat(101),
      });
    expect(ticketResponse.status).toBe(400);
    expect(ticketResponse.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('filters PC interventions by class type and class id', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    const softwareClass = referenceData.interventionClasses.find(
      (item) => item.type === 'S',
    );
    const storageClass = referenceData.interventionClasses.find(
      (item) => item.name === 'Storage',
    );
    const hardwareClass = referenceData.interventionClasses.find(
      (item) => item.name === 'Hardware',
    );
    expect(pc).toBeDefined();
    expect(softwareClass).toBeDefined();
    expect(storageClass).toBeDefined();
    expect(hardwareClass).toBeDefined();

    await insertIntervention(pc?.id ?? 0, softwareClass?.id ?? 0, 'Software task');
    await insertIntervention(pc?.id ?? 0, storageClass?.id ?? 0, 'Storage task');

    const hardwareResponse = await request(app()).get(
      `/api/pcs/${pc?.id}/interventions?type=H`,
    );
    const softwareResponse = await request(app()).get(
      `/api/pcs/${pc?.id}/interventions?type=S`,
    );
    const classResponse = await request(app()).get(
      `/api/pcs/${pc?.id}/interventions?classId=${storageClass?.id}`,
    );

    expect(hardwareResponse.status).toBe(200);
    expect(hardwareResponse.body.items.every(
      (item: { class: { type: string } }) => item.class.type === 'H',
    )).toBe(true);
    expect(softwareResponse.status).toBe(200);
    expect(softwareResponse.body.items).toHaveLength(1);
    expect(softwareResponse.body.items[0].class).toMatchObject({
      id: softwareClass?.id,
      type: 'S',
      name: 'Software',
    });
    expect(classResponse.status).toBe(200);
    expect(classResponse.body.items).toHaveLength(1);
    expect(classResponse.body.items[0].class.id).toBe(storageClass?.id);
  });

  it('applies all supported period cutoffs at their boundaries', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    const classId = referenceData.interventionClasses.find(
      (item) => item.type === 'H',
    )?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    const day = 24 * 60 * 60 * 1000;
    for (const daysAgo of [6, 8, 31, 91, 366]) {
      await insertIntervention(
        pc?.id ?? 0,
        classId ?? 0,
        `Period ${daysAgo}d`,
        new Date(Date.now() - daysAgo * day),
      );
    }

    const results = await Promise.all(
      ['7d', '30d', '90d', '1y', 'all'].map((period) =>
        request(app()).get(`/api/pcs/${pc?.id}/interventions?period=${period}`),
      ),
    );
    expect(results.map((response) => response.body.total)).toEqual([3, 4, 5, 6, 7]);
  });

  it('paginates PC interventions newest first and counts attachments', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    const classId = referenceData.interventionClasses[0]?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    const oldId = await insertIntervention(
      pc?.id ?? 0,
      classId ?? 0,
      'Older intervention',
      new Date(Date.now() - 2 * 60 * 60 * 1000),
    );
    const newestId = await insertIntervention(
      pc?.id ?? 0,
      classId ?? 0,
      'Newest intervention',
      new Date(Date.now() + 60 * 60 * 1000),
    );
    await testPool.query(
      `INSERT INTO attachment (intervention_id, file_path, caption, mime_type)
       VALUES ($1, 'test/attachment.pdf', 'Service report', 'application/pdf')`,
      [newestId],
    );

    const firstPage = await request(app()).get(
      `/api/pcs/${pc?.id}/interventions?page=1&pageSize=1`,
    );
    const secondPage = await request(app()).get(
      `/api/pcs/${pc?.id}/interventions?page=2&pageSize=1`,
    );
    const newestPage = await request(app()).get(
      `/api/pcs/${pc?.id}/interventions?page=1&pageSize=20`,
    );

    expect(firstPage.status).toBe(200);
    expect(firstPage.body).toMatchObject({
      items: [{ id: newestId, problemSummary: 'Newest intervention', attachmentCount: 1 }],
      page: 1,
      pageSize: 1,
      total: 4,
    });
    expect(secondPage.body.items[0].id).not.toBe(newestId);
    expect(newestPage.body.items.find(
      (item: { id: number }) => item.id === oldId,
    )).toBeDefined();
  });

  it('limits the problem summary to 120 characters', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    const classId = referenceData.interventionClasses[0]?.id;
    const description = 'A'.repeat(130);
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    await insertIntervention(pc?.id ?? 0, classId ?? 0, description);
    const response = await request(app()).get(
      `/api/pcs/${pc?.id}/interventions?pageSize=1`,
    );

    expect(response.status).toBe(200);
    expect(response.body.items[0].problemSummary).toBe('A'.repeat(120));
  });

  it('returns an intervention with its attachments and audit changes', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-02');
    const classId = referenceData.interventionClasses.find(
      (item) => item.name === 'Software',
    )?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    const created = await request(app())
      .post('/api/interventions')
      .send({
        pcId: pc?.id,
        classId,
        problemDescription: 'Update PC for detail endpoint',
        solution: 'Installed additional memory',
        externalTicketRef: 'TICKET-42',
        pcUpdates: { ramGb: 16 },
      });
    expect(created.status).toBe(201);

    const attachment = await testPool.query<{ id: number }>(
      `INSERT INTO attachment (intervention_id, file_path, caption, mime_type)
       VALUES ($1, 'test/detail.pdf', 'Repair evidence', 'application/pdf')
       RETURNING id`,
      [created.body.id],
    );
    const attachmentId = attachment.rows[0]?.id;
    expect(attachmentId).toBeDefined();

    const response = await request(app()).get(`/api/interventions/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: created.body.id,
      pcId: pc?.id,
      assetTag: 'PC-DZ-02',
      performedByRef: 'intervention-tech',
      externalTicketRef: 'TICKET-42',
      class: { id: classId, type: 'S', name: 'Software' },
      problemDescription: 'Update PC for detail endpoint',
      solution: 'Installed additional memory',
      attachments: [{
        id: attachmentId,
        caption: 'Repair evidence',
        mimeType: 'application/pdf',
        url: `/api/attachments/${attachmentId}/file`,
      }],
      changes: [{ fieldName: 'ramGb', oldValue: '8', newValue: '16' }],
    });
    expect(response.body.performedAt).toEqual(expect.any(String));
  });

  it('returns INTERVENTION_NOT_FOUND for a missing intervention', async () => {
    const response = await request(app()).get('/api/interventions/2147483647');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('INTERVENTION_NOT_FOUND');
  });

  it('returns PC_NOT_FOUND for a missing PC intervention list', async () => {
    const response = await request(app()).get('/api/pcs/2147483647/interventions');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PC_NOT_FOUND');
  });

  it('serves the recent feed before the parameterized intervention route', async () => {
    const pc = data.pcs.find((item) => item.assetTag === 'PC-DZ-01142');
    const softwareClass = referenceData.interventionClasses.find(
      (item) => item.name === 'Software',
    );
    const classId = softwareClass?.id;
    expect(pc).toBeDefined();
    expect(classId).toBeDefined();

    const earlierId = await insertIntervention(
      pc?.id ?? 0,
      classId ?? 0,
      'Earlier recent feed row',
      new Date(Date.now() + 60 * 60 * 1000),
    );
    const laterId = await insertIntervention(
      pc?.id ?? 0,
      classId ?? 0,
      'Later recent feed row',
      new Date(Date.now() + 2 * 60 * 60 * 1000),
    );

    const response = await request(app()).get('/api/interventions/recent?limit=2');
    const invalidLimit = await request(app()).get('/api/interventions/recent?limit=51');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((item: { id: number }) => item.id)).toEqual([laterId, earlierId]);
    expect(response.body[0]).toMatchObject({
      assetTag: 'PC-DZ-01142',
      officeCode: 'B-104',
      class: { type: 'S', name: 'Software' },
    });
    expect(response.body[0].performedAt).toEqual(expect.any(String));
    expect(invalidLimit.status).toBe(400);
    expect(invalidLimit.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('uploads image attachments with captions and generated file names', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Attach a photo',
    );
    const response = await request(app())
      .post(`/api/interventions/${interventionId}/attachments`)
      .field('captions', JSON.stringify(['Equipment label']))
      .attach('files', pngBytes, 'original-name.png');

    expect(response.status).toBe(201);
    expect(response.body.attachments).toHaveLength(1);
    expect(response.body.attachments[0]).toMatchObject({
      caption: 'Equipment label',
      mimeType: 'image/png',
      url: expect.stringMatching(/^\/api\/attachments\/\d+\/file$/),
    });

    const storedFiles = await readdir(path.join(uploadDirectory, String(interventionId)));
    expect(storedFiles).toHaveLength(1);
    const storedFile = storedFiles[0];
    expect(storedFile).toBeDefined();
    if (!storedFile) {
      throw new Error('Test setup did not produce the expected uploaded file');
    }
    expect(storedFile).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(storedFile).not.toContain('original-name');
    const storedBytes = await readFile(
      path.join(uploadDirectory, String(interventionId), storedFile),
    );
    expect(storedBytes).toEqual(pngBytes);

    const rows = await testPool.query<{
      file_path: string;
      caption: string;
      mime_type: string;
    }>(
      `SELECT file_path, caption, mime_type
       FROM attachment
       WHERE intervention_id = $1`,
      [interventionId],
    );
    expect(rows.rows).toEqual([{
      file_path: path.join(String(interventionId), storedFile),
      caption: 'Equipment label',
      mime_type: 'image/png',
    }]);
  });

  it('rejects attachment captions longer than the database column', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Reject an oversized caption',
    );
    const response = await request(app())
      .post(`/api/interventions/${interventionId}/attachments`)
      .field('captions', JSON.stringify(['C'.repeat(201)]))
      .attach('files', pngBytes, 'photo.png');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a non-image file even when it has a .jpg filename', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Reject a renamed text file',
    );
    const response = await request(app())
      .post(`/api/interventions/${interventionId}/attachments`)
      .attach('files', Buffer.from('this is not an image'), 'photo.jpg');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ATTACHMENT');
  });

  it('rejects an image larger than MAX_UPLOAD_MB', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Reject an oversized image',
    );
    const oversized = Buffer.alloc(env.MAX_UPLOAD_MB * 1024 * 1024 + 1);
    const response = await request(app())
      .post(`/api/interventions/${interventionId}/attachments`)
      .attach('files', oversized, 'large.png');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ATTACHMENT');
  });

  it('rejects more than five files', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Reject too many images',
    );
    let upload = request(app()).post(
      `/api/interventions/${interventionId}/attachments`,
    );
    for (let index = 0; index < 6; index += 1) {
      upload = upload.attach('files', pngBytes, `photo-${index}.png`);
    }
    const response = await upload;

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ATTACHMENT');
  });

  it('downloads an uploaded image inline with its detected content type', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Download an uploaded photo',
    );
    const upload = await request(app())
      .post(`/api/interventions/${interventionId}/attachments`)
      .attach('files', pngBytes, 'photo.png');
    expect(upload.status).toBe(201);
    const url = upload.body.attachments[0].url as string;

    const response = await request(app()).get(url);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^image\/png/);
    expect(response.headers['content-disposition']).toBe('inline');
    expect(response.body).toEqual(pngBytes);
  });

  it('requires authentication to download an attachment', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Require authentication for downloads',
    );
    const upload = await request(app())
      .post(`/api/interventions/${interventionId}/attachments`)
      .attach('files', pngBytes, 'photo.png');
    expect(upload.status).toBe(201);

    const unauthenticatedApp = createApp({
      verify: async () => {
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
      },
    });
    const response = await request(unauthenticatedApp).get(
      upload.body.attachments[0].url as string,
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 404 for missing attachment rows and files and blocks traversal', async () => {
    const interventionId = await insertIntervention(
      data.pcs[0]?.id ?? 0,
      referenceData.interventionClasses[0]?.id ?? 0,
      'Check missing and unsafe attachment paths',
    );
    const outsideFile = path.join(os.tmpdir(), `outside-${randomUUID()}.png`);
    const missing = await testPool.query<{ id: number }>(
      `INSERT INTO attachment (intervention_id, file_path, caption, mime_type)
       VALUES ($1, 'missing.png', NULL, 'image/png')
       RETURNING id`,
      [interventionId],
    );
    const traversal = await testPool.query<{ id: number }>(
      `INSERT INTO attachment (intervention_id, file_path, caption, mime_type)
       VALUES ($1, $2, NULL, 'image/png')
       RETURNING id`,
      [interventionId, path.relative(uploadDirectory, outsideFile)],
    );
    await writeFile(outsideFile, pngBytes);

    try {
      const missingResponse = await request(app()).get(
        `/api/attachments/${missing.rows[0]?.id}/file`,
      );
      const traversalResponse = await request(app()).get(
        `/api/attachments/${traversal.rows[0]?.id}/file`,
      );
      const unknownResponse = await request(app()).get('/api/attachments/2147483647/file');

      expect(missingResponse.status).toBe(404);
      expect(traversalResponse.status).toBe(404);
      expect(unknownResponse.status).toBe(404);
      expect(traversalResponse.body.error.code).toBe('ATTACHMENT_NOT_FOUND');
    } finally {
      await rm(outsideFile, { force: true });
    }
  });

  it('returns 404 for an unknown intervention attachment upload', async () => {
    const response = await request(app())
      .post('/api/interventions/2147483647/attachments')
      .attach('files', pngBytes, 'photo.png');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('INTERVENTION_NOT_FOUND');
  });

  afterAll(async () => {
    env.UPLOAD_DIR = originalUploadDirectory;
    await rm(uploadDirectory, { recursive: true, force: true });
    await testPool.end();
  });
});

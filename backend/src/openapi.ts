import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { attachmentParamsSchema } from './modules/attachments/schemas.js';
import { listBuildingsQuerySchema } from './modules/buildings/schemas.js';
import { listOfficesQuerySchema } from './modules/offices/schemas.js';
import { listInterventionClassesQuerySchema } from './modules/intervention-classes/schemas.js';
import {
  createInterventionBodySchema,
  getInterventionParamsSchema,
  getRecentInterventionsQuerySchema,
  listPcInterventionsParamsSchema,
  listPcInterventionsQuerySchema,
} from './modules/interventions/schemas.js';
import {
  createPcBodySchema,
  getPcHistoryQuerySchema,
  getPcParamsSchema,
  listPcsQuerySchema,
  updatePcBodySchema,
} from './modules/pcs/schemas.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const success = (description: string, status = 200) => ({
  [status]: { description },
});

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  summary: 'Check API health',
  security: [],
  responses: success('API is healthy'),
});

registry.registerPath({
  method: 'get',
  path: '/api/dashboard/stats',
  tags: ['Dashboard'],
  summary: 'Get dashboard statistics',
  responses: success('Dashboard statistics'),
});

registry.registerPath({
  method: 'get',
  path: '/api/buildings',
  tags: ['Reference data'],
  summary: 'List buildings',
  request: { query: listBuildingsQuerySchema },
  responses: success('Building list'),
});

registry.registerPath({
  method: 'get',
  path: '/api/offices',
  tags: ['Reference data'],
  summary: 'List offices',
  request: { query: listOfficesQuerySchema },
  responses: success('Office list'),
});

registry.registerPath({
  method: 'get',
  path: '/api/intervention-classes',
  tags: ['Reference data'],
  summary: 'List intervention classes',
  request: { query: listInterventionClassesQuerySchema },
  responses: success('Intervention class list'),
});

registry.registerPath({
  method: 'get',
  path: '/api/pcs',
  tags: ['PCs'],
  summary: 'Search and list PCs',
  request: { query: listPcsQuerySchema },
  responses: success('Paginated PC list'),
});

registry.registerPath({
  method: 'post',
  path: '/api/pcs',
  tags: ['PCs'],
  summary: 'Create a PC',
  request: {
    body: {
      content: { 'application/json': { schema: createPcBodySchema } },
    },
  },
  responses: success('PC created', 201),
});

registry.registerPath({
  method: 'get',
  path: '/api/pcs/{id}',
  tags: ['PCs'],
  summary: 'Get a PC',
  request: { params: getPcParamsSchema },
  responses: success('PC details'),
});

registry.registerPath({
  method: 'patch',
  path: '/api/pcs/{id}',
  tags: ['PCs'],
  summary: 'Update a PC',
  request: {
    params: getPcParamsSchema,
    body: { content: { 'application/json': { schema: updatePcBodySchema } } },
  },
  responses: success('PC updated'),
});

registry.registerPath({
  method: 'get',
  path: '/api/pcs/{id}/history',
  tags: ['PCs'],
  summary: 'Get PC change history',
  request: { params: getPcParamsSchema, query: getPcHistoryQuerySchema },
  responses: success('Paginated PC change history'),
});

registry.registerPath({
  method: 'get',
  path: '/api/pcs/{id}/interventions',
  tags: ['Interventions'],
  summary: 'List interventions for a PC',
  request: {
    params: listPcInterventionsParamsSchema,
    query: listPcInterventionsQuerySchema,
  },
  responses: success('Paginated PC interventions'),
});

registry.registerPath({
  method: 'post',
  path: '/api/interventions',
  tags: ['Interventions'],
  summary: 'Create an intervention',
  request: {
    body: {
      content: { 'application/json': { schema: createInterventionBodySchema } },
    },
  },
  responses: success('Intervention created', 201),
});

registry.registerPath({
  method: 'get',
  path: '/api/interventions/recent',
  tags: ['Interventions'],
  summary: 'List recent interventions',
  request: { query: getRecentInterventionsQuerySchema },
  responses: success('Recent intervention feed'),
});

registry.registerPath({
  method: 'get',
  path: '/api/interventions/{id}',
  tags: ['Interventions'],
  summary: 'Get an intervention',
  request: { params: getInterventionParamsSchema },
  responses: success('Intervention details'),
});

registry.registerPath({
  method: 'post',
  path: '/api/interventions/{id}/attachments',
  tags: ['Attachments'],
  summary: 'Upload intervention photos',
  request: {
    params: attachmentParamsSchema,
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            files: z.array(z.string().openapi({ format: 'binary' })).min(1).max(5),
            captions: z.string().optional().describe('Optional JSON array of captions'),
          }),
        },
      },
    },
  },
  responses: success('Attachments uploaded', 201),
});

registry.registerPath({
  method: 'get',
  path: '/api/attachments/{id}/file',
  tags: ['Attachments'],
  summary: 'Download an attachment',
  request: { params: attachmentParamsSchema },
  responses: {
    200: {
      description: 'Image file',
      content: { 'image/*': { schema: z.string().openapi({ format: 'binary' }) } },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

const generatedDocument = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'SonaMaint API',
    version: '1.0.0',
    description: 'Authenticated API for maintenance operations and reference data.',
  },
  security: [{ BearerAuth: [] }],
});

export const openApiDocument = {
  ...generatedDocument,
  components: {
    ...generatedDocument.components,
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the bearer token provided by your identity provider.',
      },
    },
  },
};

import { AppError } from '../../utils/app-error.js';
import { setAuditContext } from '../../db/auditContext.js';
import { withTransaction } from '../../db/transaction.js';
import {
  findInterventionChanges,
  findInterventionById,
  findPcInterventions,
  findRecentInterventions,
  insertIntervention,
  interventionClassExists,
  officeExists,
  pcExists,
  updatePcForIntervention,
  type CreatedIntervention,
  type InterventionDetail,
  type PcInterventionPage,
  type RecentIntervention,
} from './repository.js';
import type {
  CreateInterventionBody,
  ListPcInterventionsQuery,
} from './schemas.js';

export async function createIntervention(
  body: CreateInterventionBody,
  performedByRef: string,
  performedByName?: string,
): Promise<CreatedIntervention> {
  return withTransaction(async (client) => {
    if (!(await pcExists(client, body.pcId))) {
      throw new AppError(404, 'PC_NOT_FOUND', `PC with id ${body.pcId} was not found`);
    }
    if (!(await interventionClassExists(client, body.classId))) {
      throw new AppError(
        400,
        'INTERVENTION_CLASS_NOT_FOUND',
        `Intervention class with id ${body.classId} was not found`,
      );
    }
    if (
      body.pcUpdates?.officeId !== undefined &&
      !(await officeExists(client, body.pcUpdates.officeId))
    ) {
      throw new AppError(400, 'OFFICE_NOT_FOUND', 'The specified office does not exist');
    }

    const intervention = await insertIntervention(
      client,
      body,
      performedByRef,
      performedByName,
    );
    if (!intervention) {
      throw new Error('The intervention insert completed without returning an intervention');
    }

    await setAuditContext(client, {
      userRef: performedByRef,
      ...(performedByName === undefined ? {} : { userName: performedByName }),
      interventionId: intervention.id,
    });
    await updatePcForIntervention(client, body.pcId, body);

    return {
      id: intervention.id,
      pcId: intervention.pc_id,
      classId: intervention.class_id,
      performedAt: intervention.performed_at.toISOString(),
      changes: await findInterventionChanges(client, intervention.id),
    };
  });
}

export async function listPcInterventions(
  pcId: number,
  query: ListPcInterventionsQuery,
): Promise<PcInterventionPage> {
  const page = await findPcInterventions(pcId, query);
  if (!page) {
    throw new AppError(404, 'PC_NOT_FOUND', `PC with id ${pcId} was not found`);
  }
  return page;
}

export async function getInterventionById(id: number): Promise<InterventionDetail> {
  const intervention = await findInterventionById(id);
  if (!intervention) {
    throw new AppError(
      404,
      'INTERVENTION_NOT_FOUND',
      `Intervention with id ${id} was not found`,
    );
  }
  return intervention;
}

export async function listRecentInterventions(limit: number): Promise<RecentIntervention[]> {
  return findRecentInterventions(limit);
}

import { AppError } from '../../utils/app-error.js';
import { setAuditContext } from '../../db/auditContext.js';
import { withTransaction } from '../../db/transaction.js';
import {
  findPcById,
  findPcHistory,
  findPcs,
  insertPc,
  officeExists,
  pcExists,
  updatePcRecord,
  type Pc,
  type PcHistoryPage,
  type PcPage,
} from './repository.js';
import type {
  CreatePcBody,
  GetPcHistoryQuery,
  ListPcsQuery,
  UpdatePcBody,
} from './schemas.js';

interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  return error instanceof Error && 'code' in error;
}

export async function listPcs(query: ListPcsQuery): Promise<PcPage> {
  return findPcs(query);
}

export async function getPcById(id: number): Promise<Pc> {
  const pc = await findPcById(id);
  if (!pc) {
    throw new AppError(404, 'PC_NOT_FOUND', `PC with id ${id} was not found`);
  }
  return pc;
}

export async function createPc(body: CreatePcBody): Promise<Pc> {
  try {
    return await withTransaction(async (client) => {
      if (!(await officeExists(client, body.officeId))) {
        throw new AppError(400, 'OFFICE_NOT_FOUND', 'The specified office does not exist');
      }

      const pc = await insertPc(client, body);
      if (!pc) {
        throw new Error('The PC insert completed without returning a PC');
      }
      return pc;
    });
  } catch (error) {
    if (isPostgresError(error) && error.code === '23505' && error.constraint === 'pc_asset_tag_key') {
      throw new AppError(409, 'PC_ALREADY_EXISTS', 'A PC with this assetTag already exists');
    }
    throw error;
  }
}

export async function updatePc(
  id: number,
  body: UpdatePcBody,
  changedByRef: string,
  changedByName?: string,
): Promise<Pc> {
  return withTransaction(async (client) => {
    await setAuditContext(client, {
      userRef: changedByRef,
      ...(changedByName === undefined ? {} : { userName: changedByName }),
    });

    if (!(await pcExists(client, id))) {
      throw new AppError(404, 'PC_NOT_FOUND', `PC with id ${id} was not found`);
    }
    if (body.officeId !== undefined && !(await officeExists(client, body.officeId))) {
      throw new AppError(400, 'OFFICE_NOT_FOUND', 'The specified office does not exist');
    }

    const pc = await updatePcRecord(client, id, body);
    if (!pc) {
      throw new AppError(404, 'PC_NOT_FOUND', `PC with id ${id} was not found`);
    }
    return pc;
  });
}

export async function getPcHistory(
  id: number,
  query: GetPcHistoryQuery,
): Promise<PcHistoryPage> {
  if (!(await findPcById(id))) {
    throw new AppError(404, 'PC_NOT_FOUND', `PC with id ${id} was not found`);
  }
  return findPcHistory(id, query);
}

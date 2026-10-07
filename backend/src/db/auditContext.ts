import type { PoolClient } from 'pg';

export interface AuditContext {
  userRef: string;
  interventionId?: number | string;
}

/**
 * Set transaction-local values consumed by the pc change-log trigger.
 * Callers must invoke this with a PoolClient inside withTransaction.
 */
export async function setAuditContext(
  client: PoolClient,
  context: AuditContext,
): Promise<void> {
  await client.query(
    "SELECT set_config('sonamaint.user_ref', $1, true), set_config('sonamaint.intervention_id', $2, true)",
    [context.userRef, context.interventionId?.toString() ?? ''],
  );
}

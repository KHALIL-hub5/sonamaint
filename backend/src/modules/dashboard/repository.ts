import { pool } from '../../db/pool.js';

export interface DashboardStatistics {
  totalPcs: number;
  registeredThisMonth: number;
  activeIncidents: number;
  pcsInMaintenance: number;
  interventionsThisMonth: number;
  officesCovered: number;
}

export async function findDashboardStatistics(): Promise<DashboardStatistics> {
  const result = await pool.query<DashboardStatistics>(
    `WITH month_bounds AS (
       SELECT
         date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
           AT TIME ZONE 'Africa/Algiers' AS month_start,
         (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
           + INTERVAL '1 month') AT TIME ZONE 'Africa/Algiers' AS next_month_start
     ),
     pc_stats AS (
       SELECT
         COUNT(*)::integer AS total_pcs,
         COUNT(*) FILTER (
           WHERE pc.created_at >= month_bounds.month_start
             AND pc.created_at < month_bounds.next_month_start
         )::integer AS registered_this_month,
         COUNT(*) FILTER (WHERE pc.status = 'incident')::integer AS active_incidents,
         COUNT(*) FILTER (WHERE pc.status = 'in_maintenance')::integer AS pcs_in_maintenance,
         COUNT(DISTINCT pc.office_id)::integer AS offices_covered
       FROM pc
       CROSS JOIN month_bounds
     ),
     intervention_stats AS (
       SELECT COUNT(*)::integer AS interventions_this_month
       FROM intervention
       CROSS JOIN month_bounds
       WHERE intervention.performed_at >= month_bounds.month_start
         AND intervention.performed_at < month_bounds.next_month_start
     )
     SELECT
       pc_stats.total_pcs AS "totalPcs",
       pc_stats.registered_this_month AS "registeredThisMonth",
       pc_stats.active_incidents AS "activeIncidents",
       pc_stats.pcs_in_maintenance AS "pcsInMaintenance",
       intervention_stats.interventions_this_month AS "interventionsThisMonth",
       pc_stats.offices_covered AS "officesCovered"
     FROM pc_stats
     CROSS JOIN intervention_stats`,
  );
  const statistics = result.rows[0];
  if (!statistics) {
    throw new Error('Dashboard statistics query returned no result');
  }
  return statistics;
}

import {
  findDashboardStatistics,
  type DashboardStatistics,
} from './repository.js';

export async function getDashboardStatistics(): Promise<DashboardStatistics> {
  return findDashboardStatistics();
}

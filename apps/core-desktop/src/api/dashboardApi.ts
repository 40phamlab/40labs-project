import { getInitialDashboardSummary, type DashboardSummary } from '../devData';

export type { DashboardSummary };

export const dashboardApi = {
  getSummary: (): DashboardSummary => getInitialDashboardSummary(),
};

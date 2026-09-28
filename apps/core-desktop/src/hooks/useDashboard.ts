import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardSummary } from '../api';
import { dashboardKeys } from './queryKeys';

export function useDashboard() {
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardSummary>({
    queryKey: dashboardKeys.summary(),
    queryFn: async () => dashboardApi.getSummary(),
  });

  return {
    summary,
    isLoading,
    isError,
    error,
    refetch,
  };
}

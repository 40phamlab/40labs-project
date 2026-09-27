import { useQuery } from '@tanstack/react-query';
import type { AuditLogEntry } from '@40labs/types';
import { auditApi } from '../api';
import { auditKeys } from './queryKeys';

export function useAuditLog() {
  const {
    data: auditLogs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AuditLogEntry[]>({
    queryKey: auditKeys.list(),
    queryFn: async () => auditApi.list(),
  });

  return {
    auditLogs,
    isLoading,
    isError,
    error,
    refetch,
  };
}

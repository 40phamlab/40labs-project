import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncApi } from '../api/syncApi';
import { isTauriAvailable } from '../api/client';
import * as React from 'react';

export function useCloudSync() {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ['cloud-sync-status'],
    queryFn: syncApi.status,
    refetchInterval: 15_000,
    retry: false,
    enabled: isTauriAvailable(),
  });
  const run = useMutation({
    mutationFn: syncApi.runNow,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cloud-sync-status'] }),
  });
  React.useEffect(() => {
    if (!isTauriAvailable()) return;
    run.mutate();
    const handleOnline = () => run.mutate();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [run.mutate]);
  return { ...status, runSync: run.mutateAsync, isSyncing: run.isPending, syncError: run.error };
}

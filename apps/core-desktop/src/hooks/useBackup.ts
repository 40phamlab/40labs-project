import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BackupSchedule, BackupRecord, ScheduleChannel } from '@40labs/types';
import { backupApi, UpdateBackupSchedulePayload } from '../api';
import { backupKeys } from './queryKeys';

export type { UpdateBackupSchedulePayload };

export function useBackup() {
  const queryClient = useQueryClient();

  const {
    data: schedule,
    isLoading: isLoadingSchedule,
    isError: isErrorSchedule,
    refetch: refetchSchedule,
  } = useQuery<BackupSchedule>({
    queryKey: backupKeys.schedule(),
    queryFn: async () => backupApi.getSchedule(),
  });

  const {
    data: history = [],
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory,
  } = useQuery<BackupRecord[]>({
    queryKey: backupKeys.history(),
    queryFn: async () => backupApi.listHistory(),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (payload: UpdateBackupSchedulePayload) => backupApi.updateSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.all });
    },
  });

  const runBackupMutation = useMutation({
    mutationFn: async (destination?: ScheduleChannel) => backupApi.runBackup(destination),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.all });
    },
  });

  return {
    schedule,
    isLoadingSchedule,
    isErrorSchedule,
    refetchSchedule,

    history,
    isLoadingHistory,
    isErrorHistory,
    refetchHistory,

    updateSchedule: (payload: UpdateBackupSchedulePayload) => updateScheduleMutation.mutateAsync(payload),
    runBackup: (destination?: ScheduleChannel) => runBackupMutation.mutateAsync(destination),

    isUpdatingSchedule: updateScheduleMutation.isPending,
    isRunningBackup: runBackupMutation.isPending,
  };
}

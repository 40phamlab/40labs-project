import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BackupSchedule, BackupRecord, ScheduleChannel } from '@40labs/types';
import {
  backupApi,
  UpdateBackupSchedulePayload,
  BackupExportResult,
  BackupPreview,
  RestoreResult,
} from '../api';
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

  const exportPackMutation = useMutation({
    mutationFn: async ({
      destinationPath,
      password,
    }: {
      destinationPath: string;
      password: string;
    }): Promise<BackupExportResult> => {
      return await backupApi.exportDisasterRecoveryPack(destinationPath, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.all });
    },
  });

  const previewPackMutation = useMutation({
    mutationFn: async ({
      archivePath,
      password,
    }: {
      archivePath: string;
      password: string;
    }): Promise<BackupPreview> => {
      return await backupApi.previewDisasterRecoveryPack(archivePath, password);
    },
  });

  const restorePackMutation = useMutation({
    mutationFn: async ({
      archivePath,
      password,
    }: {
      archivePath: string;
      password: string;
    }): Promise<RestoreResult> => {
      return await backupApi.restoreDisasterRecoveryPack(archivePath, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
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

    exportPack: (destinationPath: string, password: string) =>
      exportPackMutation.mutateAsync({ destinationPath, password }),
    previewPack: (archivePath: string, password: string) =>
      previewPackMutation.mutateAsync({ archivePath, password }),
    restorePack: (archivePath: string, password: string) =>
      restorePackMutation.mutateAsync({ archivePath, password }),

    isUpdatingSchedule: updateScheduleMutation.isPending,
    isRunningBackup: runBackupMutation.isPending,
    isExportingPack: exportPackMutation.isPending,
    isPreviewingPack: previewPackMutation.isPending,
    isRestoringPack: restorePackMutation.isPending,
  };
}

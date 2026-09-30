import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PairedDevice } from '@40labs/types';
import { devicesApi } from '../api';
import { devicesKeys } from './queryKeys';

export function useDevices() {
  const queryClient = useQueryClient();

  const {
    data: devices = [],
    isLoading: isLoadingDevices,
    isError: isErrorDevices,
    error: devicesError,
    refetch: refetchDevices,
  } = useQuery<PairedDevice[]>({
    queryKey: devicesKeys.list(),
    queryFn: async () => devicesApi.list(),
  });

  const blockDeviceMutation = useMutation({
    mutationFn: async (id: string) => devicesApi.block(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devicesKeys.all });
    },
  });

  const unblockDeviceMutation = useMutation({
    mutationFn: async (id: string) => devicesApi.unblock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devicesKeys.all });
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: async (id: string) => devicesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devicesKeys.all });
    },
  });

  return {
    devices,
    isLoadingDevices,
    isErrorDevices,
    devicesError,
    refetchDevices,

    blockDevice: (id: string) => blockDeviceMutation.mutateAsync(id),
    unblockDevice: (id: string) => unblockDeviceMutation.mutateAsync(id),
    removeDevice: (id: string) => removeDeviceMutation.mutateAsync(id),

    isBlocking: blockDeviceMutation.isPending,
    isRemoving: removeDeviceMutation.isPending,
  };
}

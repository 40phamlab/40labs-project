import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IntegrationsConfig } from '@40labs/types';
import { integrationsApi, UpdateIntegrationsPayload } from '../api';
import { integrationsKeys } from './queryKeys';

export type { UpdateIntegrationsPayload };

export function useIntegrations() {
  const queryClient = useQueryClient();

  const {
    data: integrationsConfig,
    isLoading: isLoadingIntegrations,
    isError: isErrorIntegrations,
    error: integrationsError,
    refetch: refetchIntegrations,
  } = useQuery<IntegrationsConfig>({
    queryKey: integrationsKeys.detail(),
    queryFn: async () => integrationsApi.get(),
  });

  const updateIntegrationsMutation = useMutation({
    mutationFn: async (payload: UpdateIntegrationsPayload) => {
      return integrationsApi.update(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.all });
    },
  });

  return {
    integrationsConfig,
    isLoadingIntegrations,
    isErrorIntegrations,
    integrationsError,
    refetchIntegrations,

    updateIntegrations: (payload: UpdateIntegrationsPayload) =>
      updateIntegrationsMutation.mutateAsync(payload),
    isUpdatingIntegrations: updateIntegrationsMutation.isPending,
  };
}

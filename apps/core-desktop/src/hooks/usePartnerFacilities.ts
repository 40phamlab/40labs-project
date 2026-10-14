import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerFacilitiesApi } from '../api/partnerFacilitiesApi';
import type { CreatePartnerFacilityPayload } from '@40labs/types';
import { useToast } from './useToast';

export function usePartnerFacilities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: facilities = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['partner-facilities'],
    queryFn: () => partnerFacilitiesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePartnerFacilityPayload) => partnerFacilitiesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-facilities'] });
      toast.success('Partner facility added successfully');
    },
    onError: () => {
      toast.error('Failed to add partner facility');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'blocked' }) =>
      partnerFacilitiesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-facilities'] });
      toast.success('Facility status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnerFacilitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-facilities'] });
      toast.success('Partner facility removed');
    },
  });

  return {
    facilities,
    isLoading,
    isError,
    error,
    refetch,
    createFacility: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteFacility: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

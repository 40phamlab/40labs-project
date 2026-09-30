import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Business, Branch } from '@40labs/types';
import { businessApi, branchesApi, UpdateBusinessPayload } from '../api';
import type { CreateBranchPayload, UpdateBranchPayload } from '../api/branchesApi';
import { businessKeys } from './queryKeys';

export type { UpdateBusinessPayload, CreateBranchPayload, UpdateBranchPayload };

export function useBusiness() {
  const queryClient = useQueryClient();

  const {
    data: business,
    isLoading: isLoadingBusiness,
    isError: isErrorBusiness,
    error: businessError,
    refetch: refetchBusiness,
  } = useQuery<Business>({
    queryKey: businessKeys.detail(),
    queryFn: async () => businessApi.get(),
  });

  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    error: branchesError,
    refetch: refetchBranches,
  } = useQuery<Branch[]>({
    queryKey: businessKeys.branches(),
    queryFn: async () => branchesApi.list(),
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (payload: UpdateBusinessPayload) => {
      return businessApi.update(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: async (payload: CreateBranchPayload) => {
      return branchesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateBranchPayload }) => {
      return branchesApi.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });

  // UI state for Branch Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = React.useState(false);
  const [selectedBranchForEdit, setSelectedBranchForEdit] = React.useState<Branch | null>(null);

  const openAddBranchModal = () => {
    setSelectedBranchForEdit(null);
    setIsBranchModalOpen(true);
  };

  const openEditBranchModal = (branch: Branch) => {
    setSelectedBranchForEdit(branch);
    setIsBranchModalOpen(true);
  };

  const closeBranchModal = () => {
    setSelectedBranchForEdit(null);
    setIsBranchModalOpen(false);
  };

  return {
    business,
    isLoadingBusiness,
    isErrorBusiness,
    businessError,
    refetchBusiness,

    branches,
    isLoadingBranches,
    isErrorBranches,
    branchesError,
    refetchBranches,

    updateBusiness: (payload: UpdateBusinessPayload) => updateBusinessMutation.mutateAsync(payload),
    createBranch: (payload: CreateBranchPayload) => createBranchMutation.mutateAsync(payload),
    updateBranch: (id: string, payload: UpdateBranchPayload) => updateBranchMutation.mutateAsync({ id, payload }),

    isUpdatingBusiness: updateBusinessMutation.isPending,
    isCreatingBranch: createBranchMutation.isPending,
    isUpdatingBranch: updateBranchMutation.isPending,

    isBranchModalOpen,
    selectedBranchForEdit,
    openAddBranchModal,
    openEditBranchModal,
    closeBranchModal,
  };
}

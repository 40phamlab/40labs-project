import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, StaffPermissionSet } from '@40labs/types';
import { usersApi, CreateUserPayload, UpdateUserPayload } from '../api';
import { usersKeys } from './queryKeys';

export type { CreateUserPayload, UpdateUserPayload };

export function useUsers() {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery<User[]>({
    queryKey: usersKeys.list(),
    queryFn: async () => usersApi.list(),
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      return usersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateUserPayload }) => {
      return usersApi.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: StaffPermissionSet | null }) => {
      return usersApi.updatePermissions(id, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return usersApi.deactivate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  // UI state for User Modal
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<User | null>(null);

  const openAddUserModal = () => {
    setSelectedUserForEdit(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setSelectedUserForEdit(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setSelectedUserForEdit(null);
    setIsUserModalOpen(false);
  };

  return {
    users,
    isLoadingUsers,
    isErrorUsers,
    usersError,
    refetchUsers,

    createUser: (payload: CreateUserPayload) => createUserMutation.mutateAsync(payload),
    updateUser: (id: string, payload: UpdateUserPayload) => updateUserMutation.mutateAsync({ id, payload }),
    updatePermissions: (id: string, permissions: StaffPermissionSet | null) =>
      updatePermissionsMutation.mutateAsync({ id, permissions }),
    deactivateUser: (id: string) => deactivateUserMutation.mutateAsync(id),

    isCreatingUser: createUserMutation.isPending,
    isUpdatingUser: updateUserMutation.isPending,

    isUserModalOpen,
    selectedUserForEdit,
    openAddUserModal,
    openEditUserModal,
    closeUserModal,
  };
}

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@40labs/types';
import { authApi } from '../api/authApi';
import { useStepUp } from '../features/auth/stepup/StepUpProvider';

export function useUsers() {
  const queryClient = useQueryClient();
  const { requestStepUp } = useStepUp();

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery<User[]>({
    queryKey: ['users_list'],
    queryFn: async () => authApi.usersList(),
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await requestStepUp(async (_grantToken) => {
        return await authApi.userCreate({ ...payload, step_up_token: _grantToken });
      }, 'users.manage');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, payload }: { userId: string; payload: any }) => {
      return await requestStepUp(async (_grantToken) => {
        return await authApi.userUpdate(userId, { ...payload, step_up_token: _grantToken });
      }, 'users.manage');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
    },
  });

  const setUserActiveMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      return await requestStepUp(async (_grantToken) => {
        return await authApi.userSetActive(userId, active);
      }, 'users.manage');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
    },
  });

  const resetCredentialsMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await requestStepUp(async (_grantToken) => {
        return await authApi.userResetCredentials(userId);
      }, 'users.manage');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
    },
  });

  const changePinMutation = useMutation({
    mutationFn: async ({ currentPin, newPin }: { currentPin: string; newPin: string }) => {
      return await authApi.changePin(currentPin, newPin);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      return await authApi.changePassword(currentPassword, newPassword);
    },
  });

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

    createUser: (payload: any) => createUserMutation.mutateAsync(payload),
    updateUser: (userId: string, payload: any) => updateUserMutation.mutateAsync({ userId, payload }),
    setUserActive: (userId: string, active: boolean) => setUserActiveMutation.mutateAsync({ userId, active }),
    resetCredentials: (userId: string) => resetCredentialsMutation.mutateAsync(userId),

    changePin: (currentPin: string, newPin: string) => changePinMutation.mutateAsync({ currentPin, newPin }),
    changePassword: (currentPassword: string, newPassword: string) => changePasswordMutation.mutateAsync({ currentPassword, newPassword }),

    isCreatingUser: createUserMutation.isPending,
    isUpdatingUser: updateUserMutation.isPending,
    isChangingPin: changePinMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,

    isUserModalOpen,
    selectedUserForEdit,
    openAddUserModal,
    openEditUserModal,
    closeUserModal,
  };
}

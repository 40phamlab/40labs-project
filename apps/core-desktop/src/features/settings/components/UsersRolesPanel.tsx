import * as React from 'react';
import {
  DataTable,
  StatusBadge,
  type ColumnDefinition,
  IconButton,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  Panel,
} from '@40labs/ui-components';
import { MoreVertical, Plus, Edit, Power } from 'lucide-react';
import type { User } from '@40labs/types';
import { useUsers } from '../../../hooks/useUsers';
import { useBusiness } from '../../../hooks/useBusiness';
import { UserFormModal } from './UserFormModal';

const RowActions = ({
  user,
  onEdit,
  onDeactivate,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <IconButton
          icon={<MoreVertical size={14} />}
          label="User Actions"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        />
      }
    >
      <DropdownMenuItem
        label="Edit User & Permissions"
        icon={<Edit size={14} />}
        onClick={() => {
          onEdit(user);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label={user.active ? 'Deactivate User' : 'Activate User'}
        icon={<Power size={14} />}
        variant={user.active ? 'danger' : 'default'}
        onClick={() => {
          onDeactivate(user);
          setIsOpen(false);
        }}
      />
    </DropdownMenu>
  );
};

export const UsersRolesPanel: React.FC = () => {
  const {
    users,
    isLoadingUsers,
    isErrorUsers,
    refetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    isCreatingUser,
    isUpdatingUser,
    isUserModalOpen,
    selectedUserForEdit,
    openAddUserModal,
    openEditUserModal,
    closeUserModal,
  } = useUsers();

  const { branches } = useBusiness();

  const handleSaveUser = async (payload: any) => {
    if (selectedUserForEdit) {
      await updateUser(selectedUserForEdit.id, payload);
    } else {
      await createUser(payload);
    }
  };

  const handleDeactivate = async (user: User) => {
    await deactivateUser(user.id);
  };

  const columns: ColumnDefinition<User>[] = [
    {
      key: 'full_name',
      header: 'Full Name',
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-text-primary block">{user.full_name}</span>
            <span className="text-[10px] text-text-muted">ID: {user.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contacts',
      header: 'Contacts',
      render: (user) => (
        <span className="text-xs font-mono text-text-secondary">
          {user.contacts || '—'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <StatusBadge
          status={user.role === 'sudo' ? 'info' : 'active'}
          label={user.role.toUpperCase()}
        />
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (user) => (
        <span className="text-xs text-text-secondary">
          {user.location || '—'}
        </span>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (user) => {
        const branchObj = branches.find((b) => b.id === user.branch_id);
        return (
          <span className="text-xs font-mono text-text-secondary">
            {branchObj ? branchObj.name : 'Main Branch'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <StatusBadge
          status={user.active ? 'active' : 'inactive'}
          label={user.active ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      render: (user) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => openEditUserModal(user)}
          >
            Edit
          </Button>
          <RowActions
            user={user}
            onEdit={openEditUserModal}
            onDeactivate={handleDeactivate}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Staff Accounts & Orbit Worker RBAC</h3>
            <p className="text-xs text-text-muted">
              Manage system permissions, PIN authentication profiles, and role assignments for staff terminals.
            </p>
          </div>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={openAddUserModal}
          >
            Add User
          </Button>
        </div>

        <div className="border border-border/50 rounded-card overflow-hidden">
          <DataTable
            data={users}
            columns={columns}
            loading={isLoadingUsers}
            error={isErrorUsers ? 'Failed to load users.' : null}
            onRetry={refetchUsers}
            emptyMessage="No users found."
            keyExtractor={(user) => user.id}
            density="compact"
          />
        </div>
      </Panel>

      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        user={selectedUserForEdit}
        branches={branches}
        onSave={handleSaveUser}
        isLoading={isCreatingUser || isUpdatingUser}
      />
    </div>
  );
};

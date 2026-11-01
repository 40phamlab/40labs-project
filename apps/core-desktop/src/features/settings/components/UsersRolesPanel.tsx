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
import { MoreVertical, Plus, Edit, Power, Key, Lock } from 'lucide-react';
import type { User } from '@40labs/types';
import { useUsers } from '../../../hooks/useUsers';
import { useBusiness } from '../../../hooks/useBusiness';
import { UserFormModal } from './UserFormModal';

const RowActions = ({
  user,
  onEdit,
  onToggleActive,
  onResetCreds,
  onResetPin,
  isLastSudo,
}: {
  user: User;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
  onResetCreds: (user: User) => void;
  onResetPin: (user: User) => void;
  isLastSudo: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isSudo = user.role === 'sudo';

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
        label="Hariri Mtumiaji"
        icon={<Edit size={14} />}
        onClick={() => {
          onEdit(user);
          setIsOpen(false);
        }}
      />
      {!isSudo && (
        <>
          <DropdownMenuItem
            label="Weka Upya Nenosiri (Reset Password)"
            icon={<Key size={14} />}
            onClick={() => {
              onResetCreds(user);
              setIsOpen(false);
            }}
          />
          <DropdownMenuItem
            label="Weka Upya PIN (Reset PIN)"
            icon={<Lock size={14} />}
            onClick={() => {
              onResetPin(user);
              setIsOpen(false);
            }}
          />
        </>
      )}
      <DropdownMenuItem
        label={user.active ? 'Zima (Deactivate)' : 'Washa (Activate)'}
        icon={<Power size={14} />}
        variant={user.active ? 'danger' : 'default'}
        disabled={isSudo && isLastSudo && user.active}
        onClick={() => {
          if (!(isSudo && isLastSudo && user.active)) {
            onToggleActive(user);
            setIsOpen(false);
          }
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
    setUserActive,
    resetCredentials,
    resetPin,
    isCreatingUser,
    isUpdatingUser,
    isUserModalOpen,
    selectedUserForEdit,
    openAddUserModal,
    openEditUserModal,
    closeUserModal,
  } = useUsers();

  const { branches } = useBusiness();
  const [noticeResult, setNoticeResult] = React.useState<{ title: string; message: string; copyText?: string } | null>(null);

  const activeSudoCount = users.filter((u) => u.role === 'sudo' && u.active).length;

  const handleSaveUser = async (payload: any) => {
    if (selectedUserForEdit) {
      await updateUser(selectedUserForEdit.id, payload);
    } else {
      const res: any = await createUser(payload);
      if (res?.tempPassword) {
        setNoticeResult({
          title: `Kitambulisho Kipya cha Mtumiaji (@${payload.username})`,
          message: 'Nenosiri la muda (Onyesha mara moja tu):',
          copyText: res.tempPassword,
        });
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.role === 'sudo' && activeSudoCount <= 1 && user.active) {
      alert('Huwezi kumzima SUDO wa mwisho anayefanya kazi.');
      return;
    }
    await setUserActive(user.id, !user.active);
  };

  const handleResetCreds = async (user: User) => {
    if (user.role === 'sudo') {
      alert('Hakuna wa kumwekea SUDO upya kitambulisho.');
      return;
    }
    const newTemp = await resetCredentials(user.id);
    setNoticeResult({
      title: `Kitambulisho Kipya cha Nenosiri (@${user.username})`,
      message: 'Nenosiri la muda (Onyesha mara moja tu):',
      copyText: newTemp || 'temp-pass-123',
    });
  };

  const handleResetPinAction = async (user: User) => {
    if (user.role === 'sudo') {
      alert('SUDO cannot reset their own PIN via administrative reset.');
      return;
    }
    await resetPin(user.id);
    setNoticeResult({
      title: `PIN Imewekwa Upya (@${user.username})`,
      message: 'PIN imefutwa. Mtumiaji atalazimishwa kuweka PIN mpya atakapoingia tena.',
    });
  };

  const columns: ColumnDefinition<User>[] = [
    {
      key: 'full_name',
      header: 'Full Name',
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {user.full_name?.charAt(0) || user.username.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-text-primary block">{user.full_name || `${user.first_name} ${user.last_name}`}</span>
            <span className="text-[10px] text-text-muted">@{user.username}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contacts',
      render: (user) => (
        <span className="text-xs font-mono text-text-secondary">
          {user.phone || user.contacts || '—'}
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
      key: 'branch',
      header: 'Branch',
      render: (user) => {
        const branchObj = branches.find((b) => b.id === (user as any).branch_id);
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
            intent="neutral"
            size="sm"
            onClick={() => openEditUserModal(user)}
          >
            Hariri
          </Button>
          <RowActions
            user={user}
            onEdit={openEditUserModal}
            onToggleActive={handleToggleActive}
            onResetCreds={handleResetCreds}
            onResetPin={handleResetPinAction}
            isLastSudo={activeSudoCount <= 1}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {noticeResult && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-lg space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Key size={16} /> {noticeResult.title}
          </div>
          <p className="text-xs">{noticeResult.message}</p>
          {noticeResult.copyText && (
            <div className="flex items-center gap-2">
              <div className="p-2 bg-background font-mono text-sm font-bold rounded border border-success/30 select-all inline-block">
                {noticeResult.copyText}
              </div>
              <Button
                intent="neutral"
                size="sm"
                onClick={() => {
                  if (noticeResult.copyText) {
                    navigator.clipboard.writeText(noticeResult.copyText);
                    alert('Imekopishwa kwenye ubao wa kunakili (Copied)!');
                  }
                }}
              >
                Nakili (Copy)
              </Button>
            </div>
          )}
          <div className="pt-2">
            <Button intent="neutral" size="sm" onClick={() => setNoticeResult(null)}>
              Funga Taarifa Hii
            </Button>
          </div>
        </div>
      )}

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
            Ongeza Mtumiaji
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

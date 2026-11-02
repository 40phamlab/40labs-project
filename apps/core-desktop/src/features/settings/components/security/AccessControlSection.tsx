import * as React from 'react';
import { Panel, Button, StatusBadge } from '@40labs/ui-components';
import { Search, UserX } from 'lucide-react';
import { BlockUserModal } from './BlockUserModal';
import { usersApi } from '../../../../api/usersApi';
import { useStepUp } from '../../../auth/stepup/StepUpProvider';

interface AccessControlSectionProps {
  blockedUsers: Array<{ id: string; username: string; email?: string | null; blockedAt?: string; blocked_at?: string; blockedReason?: string; blocked_reason?: string; active: boolean }>;
  onRefresh: () => void;
  setToast: (msg: string) => void;
}

export const AccessControlSection: React.FC<AccessControlSectionProps> = ({ blockedUsers, onRefresh, setToast }) => {
  const { requestStepUp } = useStepUp();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showBlockModal, setShowBlockModal] = React.useState(false);

  const handleUnblock = async (userId: string, username: string) => {
    if (confirm(`Are you sure you want to unblock user "${username}"?`)) {
      try {
        await requestStepUp(async () => {
          await usersApi.unblock(userId);
        }, 'users.manage');
        setToast(`User "${username}" unblocked successfully.`);
        onRefresh();
      } catch (err: any) {
        setToast(err?.message || 'Failed to unblock user.');
      }
    }
  };

  const filtered = blockedUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">Access Control & Blocked Users</h2>
          <p className="text-xs text-text-muted">Manage suspended or blocked accounts and review system access restrictions.</p>
        </div>
        <Button
          type="button"
          intent="primary"
          size="sm"
          leftIcon={<UserX size={14} />}
          onClick={() => setShowBlockModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          Block a User Account
        </Button>
      </div>

      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blocked users..."
              className="w-full bg-panel-subtle border border-border rounded-input pl-9 pr-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <span className="text-xs font-mono text-text-muted">
            {filtered.length} blocked account(s)
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-text-muted">
            No blocked user accounts found.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((u) => {
              const blockedTime = u.blocked_at || u.blockedAt;
              const reason = u.blocked_reason || u.blockedReason || 'Administrative suspension';
              return (
                <div key={u.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                      {u.username}
                      <StatusBadge status="error" label="BLOCKED" />
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {blockedTime ? `Blocked on ${new Date(blockedTime).toLocaleDateString()} • ` : ''}Reason: {reason}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="neutral"
                    size="sm"
                    onClick={() => handleUnblock(u.id, u.username)}
                    className="text-xs text-emerald-600 hover:bg-emerald-50"
                  >
                    Unblock User
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onBlocked={() => {
          setToast('User blocked successfully.');
          onRefresh();
        }}
      />
    </div>
  );
};

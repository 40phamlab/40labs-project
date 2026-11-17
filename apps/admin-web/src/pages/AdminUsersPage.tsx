import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { AdminUserListResponse, AdminUserMe } from '@40labs/types';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newRole, setNewRole] = React.useState<'super_admin' | 'admin' | 'reviewer' | 'viewer'>('admin');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const { data: me } = useQuery<AdminUserMe>({
    queryKey: ['admin-me'],
    queryFn: () => apiFetch<AdminUserMe>('/admin/v1/me'),
  });

  const { data, isLoading, error, refetch } = useQuery<AdminUserListResponse>({
    queryKey: ['admin-users-page', searchQuery],
    queryFn: () => apiFetch<AdminUserListResponse>(`/admin/v1/admin-users?q=${encodeURIComponent(searchQuery)}&limit=50`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role, disabled }: { id: string; role?: string; disabled?: boolean }) =>
      apiFetch(`/admin/v1/admin-users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role, disabled }),
      }),
    onSuccess: async () => {
      setSuccessMsg('Administrator updated successfully.');
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 3000);
      await queryClient.invalidateQueries({ queryKey: ['admin-users-page'] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/admin/v1/admin-users', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      }),
    onSuccess: async () => {
      setShowCreateModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('admin');
      setSuccessMsg('Administrator account created successfully.');
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
      await queryClient.invalidateQueries({ queryKey: ['admin-users-page'] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg(null);
    },
  });

  const isSuperAdmin = me?.role === 'super_admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Admin User Management</h1>
          <p className="text-sm text-text-muted mt-1">Manage administrator accounts, security roles, and permissions.</p>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <UserPlus size={16} /> Create Administrator
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or ID..."
            className="w-full pl-9 pr-4 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-hover rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <AlertCircle size={32} className="mx-auto text-rose-500" />
            <p className="text-rose-500 font-medium">Failed to load administrators: {error.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ShieldCheck size={32} className="mx-auto text-text-muted opacity-40" />
            <p className="text-text-primary font-medium">No administrative users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50 text-xs text-text-muted font-medium uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {data.items.map((admin) => {
                  const isSelf = admin.id === me?.id;
                  const isDisabled = Boolean(admin.disabled_at);
                  return (
                    <tr key={admin.id} className="hover:bg-surface-hover transition-colors">
                      <td className="p-4 font-mono text-xs text-text-muted">{admin.id.substring(0, 10)}...</td>
                      <td className="p-4 font-medium text-text-primary flex items-center gap-2">
                        {admin.email}
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-action-primary/10 text-action-primary">
                            You
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isSuperAdmin && !isSelf ? (
                          <select
                            value={admin.role}
                            onChange={(e) => updateMutation.mutate({ id: admin.id, role: e.target.value })}
                            className="px-2 py-1 bg-app-bg border border-border rounded text-xs font-mono uppercase text-text-primary focus:outline-none focus:border-action-primary"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-mono uppercase font-semibold bg-surface-hover text-text-secondary">
                            {admin.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${isDisabled ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                          {isDisabled ? 'Disabled' : 'Enabled'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-text-muted">
                        {new Date(admin.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        {isSuperAdmin && !isSelf && (
                          <button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: admin.id, disabled: !isDisabled })}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                              isDisabled
                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                            }`}
                          >
                            {isDisabled ? 'Enable' : 'Disable'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Administrator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-border max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-heading font-bold text-text-primary">Create Administrator Account</h3>
            <p className="text-xs text-text-muted">Provision a new admin account with a secure temporary password and assigned role.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@40labs.com"
                  className="w-full px-3 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-action-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Temporary Password (min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-action-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-app-bg border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-action-primary"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary border border-border rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createMutation.isPending || !newEmail || newPassword.length < 8}
                onClick={() => createMutation.mutate()}
                className="px-4 py-2 bg-action-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PHASE: Admin-A
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { AdminAuditListResponse, AdminSession, AdminUserListResponse, AdminUserMe } from '@40labs/types';

export function AccountPage() {
  const [tab, setTab] = useState<'profile' | 'totp' | 'sessions' | 'users' | 'audit'>('profile');
  const queryClient = useQueryClient();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useQuery<AdminUserMe>({
    queryKey: ['admin-me'],
    queryFn: () => apiFetch<AdminUserMe>('/admin/v1/me'),
  });

  const { data: sessions, isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery<AdminSession[]>({
    queryKey: ['admin-sessions'],
    queryFn: () => apiFetch<AdminSession[]>('/admin/v1/auth/sessions'),
    enabled: tab === 'sessions',
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiFetch(`/admin/v1/auth/sessions/${sessionId}/revoke`, { method: 'POST' }),
    onSuccess: () => {
      refetchSessions();
    },
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const adminUsersQuery = useQuery<AdminUserListResponse>({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch<AdminUserListResponse>('/admin/v1/admin-users?page=1&limit=100'),
    enabled: tab === 'users' && isSuperAdmin,
  });
  const auditQuery = useQuery<AdminAuditListResponse>({
    queryKey: ['admin-audit-log'],
    queryFn: () => apiFetch<AdminAuditListResponse>('/admin/v1/audit-log?page=1&limit=50'),
    enabled: tab === 'audit' && isSuperAdmin,
  });
  const updateAdminMutation = useMutation({
    mutationFn: ({ id, role, disabled }: { id: string; role?: string; disabled?: boolean }) =>
      apiFetch(`/admin/v1/admin-users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ role, disabled }) }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const [actionError, setActionError] = useState('');

  const handleLogout = async () => {
    try {
      await apiFetch('/admin/v1/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not sign out. Please retry.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="m-0 text-xl font-semibold text-text-primary">Admin Account & Security</h1>
          <p className="mt-1 text-sm text-text-muted">Manage profile, multi-factor authentication, and active sessions</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Sign Out
        </button>
      </div>
      {actionError && <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger">{actionError}</p>}

      <div className="flex space-x-2 border-b border-border">
        {(['profile', 'totp', 'sessions', ...(isSuperAdmin ? ['users', 'audit'] as const : [])] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-action-primary text-action-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface-primary p-6 shadow-elevation-raised">
        {tab === 'profile' && (
          userLoading ? (
                <div className="animate-pulse space-y-3" aria-label="Loading profile"><div className="h-5 w-1/2 rounded bg-surface-hover" /><div className="h-5 w-2/3 rounded bg-surface-hover" /></div>
          ) : userError ? (
            <div className="space-y-3" role="alert"><p className="text-sm text-danger">Could not load profile: {(userError as Error).message}</p><button type="button" onClick={() => refetchUser()} className="text-sm font-semibold text-action-primary">Retry</button></div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-text-muted">Admin ID</label>
                <div className="mt-1 break-all font-mono text-sm text-text-primary">{user?.id}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted">Email Address</label>
                <div className="mt-1 text-sm text-text-primary">{user?.email}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted">Access Role</label>
                <div className="mt-1 inline-block rounded-full border border-success-border bg-success-bg px-2.5 py-1 text-xs font-semibold text-success">
                  {user?.role}
                </div>
              </div>
            </div>
          )
        )}

        {tab === 'totp' && (
          <div className="space-y-4 max-w-md">
            <h2 className="text-base font-semibold text-text-primary">Authenticator App (TOTP)</h2>
            <p className="text-sm text-text-muted">
              Multi-factor authentication is required for all admin access. This session was verified with an authenticator code.
            </p>
            <div className="rounded-lg border border-success-border bg-success-bg p-4">
              <span className="text-xs font-medium text-success">● MFA verified for this session</span>
            </div>
          </div>
        )}

        {tab === 'sessions' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Active Admin Sessions</h2>
            {sessionsLoading ? (
              <div className="animate-pulse space-y-3" aria-label="Loading sessions"><div className="h-8 rounded bg-surface-hover" /><div className="h-8 rounded bg-surface-hover" /></div>
            ) : sessionsError ? (
              <div className="space-y-3" role="alert"><p className="text-sm text-danger">Could not load sessions: {(sessionsError as Error).message}</p><button type="button" onClick={() => refetchSessions()} className="text-sm font-semibold text-action-primary">Retry</button></div>
            ) : !sessions || sessions.length === 0 ? (
              <div className="text-sm text-text-muted">No active sessions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-text-muted">
                      <th className="pb-3 font-medium">Session ID</th>
                      <th className="pb-3 font-medium">Expires At</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map((s) => {
                      const isRevoked = !!s.revoked_at;
                      const isExpired = new Date(s.expires_at).getTime() <= nowMs;
                      return (
                        <tr key={s.id} className="text-text-primary">
                          <td className="py-3 font-mono text-xs">{s.id.substring(0, 12)}...</td>
                          <td className="py-3 text-xs">{new Date(s.expires_at).toLocaleString()}</td>
                          <td className="py-3">
                            {isRevoked ? (
                              <span className="rounded bg-danger-bg px-2 py-0.5 text-[11px] text-danger">Revoked</span>
                            ) : isExpired ? (
                              <span className="rounded bg-surface-hover px-2 py-0.5 text-[11px] text-text-muted">Expired</span>
                            ) : (
                              <span className="rounded bg-success-bg px-2 py-0.5 text-[11px] text-success">Active</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {!isRevoked && !isExpired && (
                              <button
                                onClick={() => revokeMutation.mutate(s.id)}
                                disabled={revokeMutation.isPending}
                                className="rounded px-3 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-bg disabled:opacity-50"
                              >
                                Revoke
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
            {revokeMutation.error && <p role="alert" className="text-sm text-danger">Could not revoke session: {(revokeMutation.error as Error).message}</p>}
          </div>
        )}

        {tab === 'users' && isSuperAdmin && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Administrative users and roles</h2>
            {adminUsersQuery.isLoading ? <p className="text-sm text-text-muted">Loading administrative users…</p> : adminUsersQuery.error ? <div role="alert" className="text-sm text-danger">Could not load administrative users: {(adminUsersQuery.error as Error).message}</div> : (
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-xs text-text-muted"><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3">Status</th><th className="pb-3">Action</th></tr></thead><tbody className="divide-y divide-border">
                {adminUsersQuery.data?.items.map((admin) => <tr key={admin.id}><td className="py-3">{admin.email}</td><td className="py-3"><select aria-label={`Role for ${admin.email}`} value={admin.role} disabled={admin.id === user?.id || updateAdminMutation.isPending} onChange={(event) => updateAdminMutation.mutate({ id: admin.id, role: event.target.value })} className="rounded border border-border bg-surface-primary px-2 py-1"><option value="super_admin">super_admin</option><option value="admin">admin</option><option value="reviewer">reviewer</option><option value="viewer">viewer</option></select></td><td className="py-3">{admin.disabled_at ? 'Disabled' : 'Enabled'}</td><td className="py-3"><button type="button" disabled={admin.id === user?.id || updateAdminMutation.isPending} onClick={() => updateAdminMutation.mutate({ id: admin.id, disabled: !admin.disabled_at })} className="rounded px-2 py-1 text-xs text-danger hover:bg-danger-bg">{admin.disabled_at ? 'Enable' : 'Disable'}</button></td></tr>)}
              </tbody></table></div>
            )}
            {updateAdminMutation.error && <p role="alert" className="text-sm text-danger">Could not update administrative user: {(updateAdminMutation.error as Error).message}</p>}
            <p className="text-xs text-text-muted">New account creation is not available through the administrative API.</p>
          </div>
        )}

        {tab === 'audit' && isSuperAdmin && (
          <div className="space-y-4"><h2 className="text-base font-semibold text-text-primary">Administrative audit records</h2>
            {auditQuery.isLoading ? <p className="text-sm text-text-muted">Loading audit records…</p> : auditQuery.error ? <div role="alert" className="text-sm text-danger">Could not load audit records: {(auditQuery.error as Error).message}</div> : !auditQuery.data?.data.length ? <p className="text-sm text-text-muted">No administrative audit records.</p> : <div className="divide-y divide-border">{auditQuery.data.data.map((entry) => <div key={entry.id} className="py-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{entry.action}</strong><span className="text-text-muted">{entry.admin_email ?? 'Unknown admin'} · {new Date(entry.created_at).toLocaleString()}</span></div><div className="mt-1 text-xs text-text-muted">{entry.target_type}: {entry.target_id}</div>{entry.payload && <pre className="mt-2 overflow-x-auto rounded bg-surface-hover p-2 text-xs">{JSON.stringify(entry.payload, null, 2)}</pre>}</div>)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// PHASE: Admin-A
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

interface UserMe {
  id: string;
  email: string;
  role: string;
}

interface SessionItem {
  id: string;
  expires_at: string;
  ip?: string;
  user_agent?: string;
  revoked_at?: string;
}

export function AccountPage() {
  const [tab, setTab] = useState<'profile' | 'totp' | 'sessions'>('profile');
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useQuery<UserMe>({
    queryKey: ['admin-me'],
    queryFn: () => apiFetch<UserMe>('/admin/v1/me'),
  });

  const { data: sessions, isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery<SessionItem[]>({
    queryKey: ['admin-sessions'],
    queryFn: () => apiFetch<SessionItem[]>('/admin/v1/auth/sessions'),
    enabled: tab === 'sessions',
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiFetch(`/admin/v1/auth/sessions/${sessionId}/revoke`, { method: 'POST' }),
    onSuccess: () => {
      refetchSessions();
    },
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
        {(['profile', 'totp', 'sessions'] as const).map((t) => (
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
      </div>
    </div>
  );
}

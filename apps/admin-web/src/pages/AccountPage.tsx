// PHASE: Admin-A
import React, { useState, useMemo } from 'react';
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

  const { data: user, isLoading: userLoading } = useQuery<UserMe>({
    queryKey: ['admin-me'],
    queryFn: () => apiFetch<UserMe>('/admin/v1/me'),
  });

  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery<SessionItem[]>({
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

  const handleLogout = async () => {
    try {
      await apiFetch('/admin/v1/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
    }
  };

  const nowIso = useMemo(() => new Date().toISOString(), []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--color-border,#e5e4e7)] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-h,#08060d)] m-0">Admin Account & Security</h1>
          <p className="text-sm text-[var(--color-text,#6b6375)] mt-1">Manage profile, multi-factor authentication, and active sessions</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-[8px] bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="flex space-x-2 border-b border-[var(--color-border,#e5e4e7)]">
        {(['profile', 'totp', 'sessions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[var(--color-text,#6b6375)] hover:text-[var(--color-text-h,#08060d)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-[12px] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[var(--color-border,#e5e4e7)] dark:bg-[#16171d] dark:border-[#2e303a]">
        {tab === 'profile' && (
          userLoading ? (
            <div className="text-sm font-mono text-[var(--color-text,#6b6375)]">Loading profile...</div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text,#6b6375)]">Admin ID</label>
                <div className="text-sm font-mono text-[var(--color-text-h,#08060d)] mt-1">{user?.id}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text,#6b6375)]">Email Address</label>
                <div className="text-sm text-[var(--color-text-h,#08060d)] mt-1">{user?.email}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text,#6b6375)]">Access Role</label>
                <div className="inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400">
                  {user?.role}
                </div>
              </div>
            </div>
          )
        )}

        {tab === 'totp' && (
          <div className="space-y-4 max-w-md">
            <h2 className="text-base font-semibold text-[var(--color-text-h,#08060d)]">Authenticator App (TOTP)</h2>
            <p className="text-sm text-[var(--color-text,#6b6375)]">
              Multi-factor authentication via TOTP is mandatory for all admin access. Your secret is securely encrypted at rest.
            </p>
            <div className="p-4 rounded-[8px] bg-[var(--color-surface,#F8FAFB)] border border-[var(--color-border,#e5e4e7)] dark:bg-[#1f2028]">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">● TOTP Enabled & Active</span>
            </div>
          </div>
        )}

        {tab === 'sessions' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text-h,#08060d)]">Active Admin Sessions</h2>
            {sessionsLoading ? (
              <div className="text-sm font-mono text-[var(--color-text,#6b6375)]">Loading sessions...</div>
            ) : !sessions || sessions.length === 0 ? (
              <div className="text-sm text-[var(--color-text,#6b6375)]">No active sessions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border,#e5e4e7)] text-xs text-[var(--color-text,#6b6375)]">
                      <th className="pb-3 font-medium">Session ID</th>
                      <th className="pb-3 font-medium">Expires At</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border,#e5e4e7)]">
                    {sessions.map((s) => {
                      const isRevoked = !!s.revoked_at;
                      const isExpired = s.expires_at < nowIso;
                      return (
                        <tr key={s.id} className="text-[var(--color-text-h,#08060d)]">
                          <td className="py-3 font-mono text-xs">{s.id.substring(0, 12)}...</td>
                          <td className="py-3 text-xs">{new Date(s.expires_at).toLocaleString()}</td>
                          <td className="py-3">
                            {isRevoked ? (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">Revoked</span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Expired</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">Active</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {!isRevoked && !isExpired && (
                              <button
                                onClick={() => revokeMutation.mutate(s.id)}
                                className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-950/30 transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
}

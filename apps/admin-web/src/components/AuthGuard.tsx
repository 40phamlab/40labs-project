// PHASE: Admin-A
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { AdminUserMe } from '@40labs/types';

export function AuthGuard() {
  const { data: user, isLoading, error } = useQuery<AdminUserMe>({
    queryKey: ['admin-me'],
    queryFn: () => apiFetch<AdminUserMe>('/admin/v1/me'),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-app-bg text-text-muted">
        <div className="w-72 space-y-3" aria-label="Authenticating admin session"><div className="h-6 w-2/3 animate-pulse rounded bg-surface-hover" /><div className="h-4 animate-pulse rounded bg-surface-hover" /></div>
      </div>
    );
  }

  if (error || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

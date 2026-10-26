// PHASE: Admin-A
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface UserMe {
  id: string;
  email: string;
  role: string;
}

export function AuthGuard() {
  const { data: user, isLoading, error } = useQuery<UserMe>({
    queryKey: ['admin-me'],
    queryFn: () => apiFetch<UserMe>('/admin/v1/me'),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface,#F8FAFB)] text-[var(--color-text,#6b6375)]">
        <div className="text-sm font-mono">Authenticating admin session...</div>
      </div>
    );
  }

  if (error || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

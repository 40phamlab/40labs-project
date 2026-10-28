// PHASE: Admin-A
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface LoginResponse {
  mfa_required: boolean;
  challenge_id: string;
  enrollment_required?: boolean;
  otpauth_url?: string;
}

interface TotpResponse {
  success: boolean;
  role: string;
}

export function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [enrollmentRequired, setEnrollmentRequired] = useState(false);
  const [otpUrl, setOtpUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>('/admin/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setChallengeId(res.challenge_id);
      if (res.enrollment_required) {
        setEnrollmentRequired(true);
        setOtpUrl(res.otpauth_url || '');
      }
      setStep('totp');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch<TotpResponse>('/admin/v1/auth/totp', {
        method: 'POST',
        body: JSON.stringify({ challenge_id: challengeId, code }),
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid TOTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-md rounded-card border border-border bg-surface-primary p-8 shadow-elevation-raised">
        <div className="mb-6 text-center">
          <h1 className="m-0 text-2xl font-semibold text-text-primary">40Labs Admin</h1>
          <p className="mt-1 text-sm text-text-muted">Platform Operations & Oversight</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-input border border-border bg-surface-disabled px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                placeholder="admin@40labs.io"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-input border border-border bg-surface-disabled px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-action-primary py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="space-y-4">
            {enrollmentRequired && (
              <div className="space-y-2 rounded-lg border border-warning-border bg-warning-bg p-3 text-xs text-warning">
                <p className="font-semibold">First-time TOTP Enrollment Required</p>
                <p>Scan this URI with your authenticator app (Google Authenticator, Authy, etc.):</p>
                <div className="break-all rounded border border-border bg-surface-elevated p-2 font-mono text-[11px] text-text-primary">
                  {otpUrl}
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">6-Digit TOTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-input border border-border bg-surface-disabled px-3 py-2 text-center font-mono text-lg tracking-widest text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-action-primary py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify TOTP & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

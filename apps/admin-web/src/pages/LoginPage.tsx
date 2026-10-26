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
  success: bool;
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface,#F8FAFB)] px-4">
      <div className="w-full max-w-md rounded-[12px] bg-white p-8 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-[var(--color-border,#e5e4e7)] dark:bg-[#16171d] dark:border-[#2e303a]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-h,#08060d)] m-0">40Labs Admin</h1>
          <p className="text-sm text-[var(--color-text,#6b6375)] mt-1">Platform Operations & Oversight</p>
        </div>

        {error && (
          <div className="mb-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-900">
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text,#6b6375)] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[8px] border border-[var(--color-border,#e5e4e7)] px-3 py-2 text-sm bg-transparent text-[var(--color-text-h,#08060d)] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                placeholder="admin@40labs.io"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text,#6b6375)] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[8px] border border-[var(--color-border,#e5e4e7)] px-3 py-2 text-sm bg-transparent text-[var(--color-text-h,#08060d)] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[8px] bg-[#16A34A] py-2.5 text-sm font-medium text-white hover:bg-[#15803d] transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="space-y-4">
            {enrollmentRequired && (
              <div className="rounded-[8px] bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 space-y-2">
                <p className="font-semibold">First-time TOTP Enrollment Required</p>
                <p>Scan this URI with your authenticator app (Google Authenticator, Authy, etc.):</p>
                <div className="p-2 bg-white rounded font-mono text-[11px] break-all border dark:bg-black/40">
                  {otpUrl}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text,#6b6375)] mb-1">6-Digit TOTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-[8px] border border-[var(--color-border,#e5e4e7)] px-3 py-2 text-center text-lg font-mono tracking-widest bg-transparent text-[var(--color-text-h,#08060d)] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[8px] bg-[#16A34A] py-2.5 text-sm font-medium text-white hover:bg-[#15803d] transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify TOTP & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

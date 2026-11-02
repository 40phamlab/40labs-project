'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { GatedAction } from '@/config/board';

interface SignupGateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: GatedAction | string;
  onSuccess?: () => void;
}

const ROLES = ['Doctor', 'Researcher', 'Student', 'Pharmacist', 'Other'] as const;

export function SignupGateDialog({ isOpen, onClose, action, onSuccess }: SignupGateDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('Researcher');
  const [institution, setInstitution] = useState('');
  const [hp, setHp] = useState(''); // Honeypot
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, institution, hp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setSuccessMessage("You're on the list.");
      try {
        localStorage.setItem('jarida_waitlist_submitted', 'true');
      } catch (e) {
        // ignore
      }

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const actionTitleMap: Record<string, string> = {
    comment: 'Sign up to comment',
    save: 'Sign up to save paper',
    follow: 'Sign up to follow',
    contribute: 'Sign up to contribute',
    fullpaper: 'Sign up to access full paper',
  };

  const headingText = actionTitleMap[action] || 'Sign up to continue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-md bg-[#121814] border border-white/10 p-6 shadow-2xl flex flex-col gap-6 relative"
        style={{ borderRadius: '12px' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <h2 id="dialog-title" className="text-xl font-heading font-bold text-white pr-6">
          {headingText}
        </h2>

        {successMessage ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            <CheckCircle2 size={48} className="text-[#16A34A]" />
            <p className="text-lg font-heading font-bold text-white">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Honeypot */}
            <input
              type="text"
              name="hp"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-sans">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 font-sans">Name</label>
              <input
                ref={firstInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                required
                className="w-full px-3.5 py-2.5 bg-[#0B0F0D] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#16A34A] font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 font-sans">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@hospital.org"
                required
                className="w-full px-3.5 py-2.5 bg-[#0B0F0D] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#16A34A] font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 font-sans">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#16A34A] font-sans"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#121814] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 font-sans">
                Institution <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Muhimbili National Hospital"
                className="w-full px-3.5 py-2.5 bg-[#0B0F0D] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#16A34A] font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 px-4 bg-[#F97316] text-white text-xs font-bold rounded-lg hover:bg-[#F97316]/90 transition-colors flex items-center justify-center gap-2 font-sans disabled:opacity-50"
            >
              <span>{submitting ? 'Joining...' : 'Join Waitlist'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

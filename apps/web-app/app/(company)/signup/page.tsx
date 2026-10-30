"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    // Client-side simulation stub
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-20 sm:py-28 flex flex-col gap-10 text-[#F8FAFB]">
      <div className="flex flex-col gap-3 text-center">
        <span className="font-comfortaa text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          Get Started with 40Labs
        </span>
        <h1 className="font-comfortaa text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Create Your Account
        </h1>
        <p className="font-comfortaa text-sm text-gray-300">
          Power your healthcare facility with foundational clinical and inventory infrastructure.
        </p>
      </div>

      <div
        className="rounded-[24px] border border-white/10 bg-[#121814]/90 backdrop-blur-md p-6 sm:p-10 shadow-xl"
        style={{ borderRadius: '24px' }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          {success && (
            <div role="status" className="p-4 rounded-xl bg-[#16A34A]/20 border border-[#16A34A]/40 text-green-300 text-sm flex items-center gap-3">
              <CheckCircle2 size={20} className="text-[#16A34A] shrink-0" aria-hidden="true" />
              <span>Account created successfully! Welcome to 40Labs.</span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="signup-name" className="font-comfortaa text-xs font-bold uppercase tracking-wider text-gray-300">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Juma Mwinyi"
              className="font-comfortaa w-full h-12 px-4 text-sm bg-[#0B0F0D] border border-white/10 rounded-[12px] text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="signup-email" className="font-comfortaa text-xs font-bold uppercase tracking-wider text-gray-300">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juma@pharmacy.co.tz"
              className="font-comfortaa w-full h-12 px-4 text-sm bg-[#0B0F0D] border border-white/10 rounded-[12px] text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="signup-password" className="font-comfortaa text-xs font-bold uppercase tracking-wider text-gray-300">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="font-comfortaa w-full h-12 px-4 text-sm bg-[#0B0F0D] border border-white/10 rounded-[12px] text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="signup-confirm-password" className="font-comfortaa text-xs font-bold uppercase tracking-wider text-gray-300">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="font-comfortaa w-full h-12 px-4 text-sm bg-[#0B0F0D] border border-white/10 rounded-[12px] text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="font-comfortaa w-full py-4 rounded-[12px] text-sm font-bold bg-[#F97316] text-white hover:bg-orange-600 transition-transform active:scale-95 shadow-lg disabled:opacity-50 min-h-[44px] flex items-center justify-center"
              style={{ borderRadius: '12px' }}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="font-comfortaa text-xs text-gray-400">
              Already have an account?{' '}
              <a href="https://core.40labs.com/login" className="font-comfortaa text-[#16A34A] font-semibold hover:underline">
                Log in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

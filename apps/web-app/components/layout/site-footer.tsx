"use client";

import React, { useState } from 'react';
import { darkTokens } from '@40labs/design-tokens';
import { Button } from '@40labs/ui-components';

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateAndSanitizeEmail = (rawEmail: string): { valid: boolean; sanitized: string; message?: string } => {
    if (!rawEmail) {
      return { valid: false, sanitized: '', message: 'Email address cannot be empty.' };
    }

    const trimmed = rawEmail.trim();

    if (!trimmed) {
      return { valid: false, sanitized: '', message: 'Email address cannot be empty.' };
    }

    if (trimmed.length > 254) {
      return { valid: false, sanitized: trimmed, message: 'Email address is too long (max 254 characters).' };
    }

    // Check for potential HTML/script injection or dangerous characters
    if (/[<>'"`;]/.test(trimmed) || /script/i.test(trimmed) || /^javascript:/i.test(trimmed)) {
      return { valid: false, sanitized: '', message: 'Invalid characters detected in email address.' };
    }

    // Standard email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, sanitized: trimmed, message: 'Please enter a valid email address.' };
    }

    return { valid: true, sanitized: trimmed };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const result = validateAndSanitizeEmail(email);
    if (!result.valid) {
      setError(result.message || 'Invalid email');
      return;
    }

    console.log("Newsletter subscription submitted:", result.sanitized);
    setSuccess(true);
    setEmail('');
  };

  return (
    <footer className="w-full mt-auto py-16 px-4 sm:px-8">
      {/* Large rounded outlined container footer shell */}
      <div
        className="max-w-7xl mx-auto rounded-[32px] p-8 sm:p-16 flex flex-col gap-12 web-card"
        style={{
          borderRadius: '32px',
          backgroundColor: darkTokens.colors.surface || '#1A221E',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Link Columns */}
          {[
            { title: 'Platform', links: ['Services', 'Products', 'Tools', 'Articles'] },
            { title: 'Company', links: ['About Us', 'Contact', 'Partners', 'Careers'] },
            { title: 'Resources', links: ['Help Center', 'Blog', 'Developers', 'Status'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'] },
          ].map((col) => (
            <div key={col.title} className="flex flex-col gap-6">
              <h4 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: darkTokens.colors.text }}>
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs transition-colors hover:opacity-80" style={{ color: darkTokens.colors.text }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="flex flex-col gap-6 md:col-span-1">
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: darkTokens.colors.text }}>
              Stay Updated
            </h4>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address for newsletter
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email"
                  aria-invalid={!!error}
                  aria-describedby={error ? "newsletter-error" : undefined}
                  className="w-full h-11 px-6 text-xs focus:outline-none transition-shadow"
                  style={{
                    backgroundColor: darkTokens.colors.bg,
                    color: darkTokens.colors.text,
                    borderRadius: darkTokens.radius.pill,
                    border: error ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                {error && (
                  <span id="newsletter-error" role="alert" className="text-[11px] text-red-400 px-2">
                    {error}
                  </span>
                )}
                {success && (
                  <span role="status" className="text-[11px] text-green-400 px-2">
                    Subscribed successfully!
                  </span>
                )}
              </div>
              <Button
                type="submit"
                className="w-full !h-11 !px-6 !text-xs !font-bold"
                style={{
                  backgroundColor: darkTokens.colors.highlight || '#16A34A',
                  color: '#ffffff',
                  borderRadius: darkTokens.radius.pill,
                  border: 'none',
                }}
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom info */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-tiny opacity-60" style={{ color: darkTokens.colors.text }}>
             © {new Date().getFullYear()} 40Labs. All rights reserved. Built for the future of healthcare.
           </p>
           <div className="flex gap-6">
              {['Twitter', 'LinkedIn', 'Github'].map(social => (
                <a key={social} href="#" className="text-tiny opacity-60 hover:opacity-100 transition-opacity" style={{ color: darkTokens.colors.text }}>
                  {social}
                </a>
              ))}
           </div>
        </div>
      </div>
    </footer>
  );
}

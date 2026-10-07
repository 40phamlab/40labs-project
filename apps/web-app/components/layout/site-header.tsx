"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';
import { IconButton } from '@40labs/ui-components';
import { AppLauncherMenu } from './app-launcher-menu';

const ecosystemNavLinks = [
  { label: 'Platform', href: '/products' },
  { label: 'Solutions', href: '/services' },
  { label: 'Intelligence', href: '/blog' },
  { label: 'Company', href: '/about' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-center ${
        isScrolled ? 'backdrop-blur-md bg-[#0B0F0D]/85 shadow-lg border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div
        className="w-full max-w-7xl h-16 px-6 sm:px-8 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--color-surface-secondary, #222C27)',
          borderRadius: 'var(--radius-pill, 9999px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid var(--color-border-default, #28362E)',
        }}
      >
        {/* Logo / Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-0 font-heading text-xl font-bold tracking-tight shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg outline-none"
        >
          <span style={{ color: 'var(--color-accent-orange, #F97316)' }}>40</span>
          <span style={{ color: 'var(--color-text-primary, #F8FAFB)' }}>Labs</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 ml-8">
          {ecosystemNavLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 outline-none"
                style={{
                  color: isActive ? 'var(--color-accent-orange, #F97316)' : 'rgba(248, 250, 251, 0.7)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <AppLauncherMenu />
          <Link
            href="/about"
            className="text-xs font-semibold px-4 py-2 rounded-full transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            style={{
              color: 'rgba(248, 250, 251, 0.8)',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/products"
            className="text-xs font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-95 flex items-center gap-2 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            style={{
              backgroundColor: 'var(--color-action-primary, #16A34A)',
              color: '#F8FAFB',
            }}
          >
            Get Started
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <AppLauncherMenu />
          <IconButton
            icon={mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            label="Toggle Menu"
            intent="ghost"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="!w-10 !h-10 text-white"
          />
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="absolute top-full left-4 right-4 mt-2 p-6 rounded-2xl md:hidden z-50 flex flex-col gap-5 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: '#121815',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          <nav className="flex flex-col gap-4">
            {ecosystemNavLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-between"
                  style={{
                    color: isActive ? 'var(--color-accent-orange, #F97316)' : '#F8FAFB',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  }}
                >
                  {link.label}
                  <ArrowRight size={16} className="opacity-40" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white"
            >
              Sign In
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-bold rounded-xl flex items-center justify-center gap-2 text-white shadow-md"
              style={{
                backgroundColor: 'var(--color-action-primary, #16A34A)',
              }}
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

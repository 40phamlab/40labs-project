"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { getCompanyNavItems, isNavActive } from '@/mock-data/navigation';

export function CompanyHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navItems = getCompanyNavItems();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = () => {
    console.log("Login stub clicked");
  };

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-8 flex flex-col items-center transition-all duration-300">
      <div
        className={`w-full max-w-7xl h-16 px-6 sm:px-8 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-lg border border-[#B6C2CC]/80'
            : 'bg-white/95 backdrop-blur-sm shadow-md border border-[#B6C2CC]'
        }`}
        style={{
          borderRadius: '9999px',
        }}
      >
        {/* Logo home link */}
        <div className="flex items-center">
          <Logo variant="light" />
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-sm font-medium transition-colors hover:text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] rounded-md px-2 py-1 ${
                  active ? 'text-[#16A34A] font-semibold' : 'text-[#4A5568]'
                }`}
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#16A34A] rounded-full animate-in fade-in duration-200" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Log In button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              borderRadius: '9999px',
            }}
          >
            Log In
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#F97316]"
          >
            Log In
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-[#1F2A33] hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            aria-expanded={mobileOpen}
            aria-label="Toggle mobile navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div
          className="w-full max-w-7xl mt-2 p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#B6C2CC] shadow-xl lg:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-base font-semibold py-3 px-4 rounded-xl transition-colors ${
                    active
                      ? 'bg-[#16A34A]/10 text-[#16A34A]'
                      : 'text-[#1F2A33] hover:bg-[#E4E9EC]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

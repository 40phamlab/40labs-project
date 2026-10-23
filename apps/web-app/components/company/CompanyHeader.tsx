"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const companyNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'products', href: '/products' },
  { label: 'blog', href: '/blog' },
  { label: 'pricing', href: '/pricing' },
  { label: 'publications', href: '/publications' },
  { label: 'about', href: '/about' },
];

export function CompanyHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogin = () => {
    // TODO: wire auth [no backend yet] [post-MVP]
    console.log("Login stub clicked");
  };

  return (
    <header className="w-full pt-6 px-4 sm:px-8 flex flex-col items-center relative z-50">
      <div
        className="w-full max-w-7xl h-16 px-6 sm:px-8 flex items-center justify-between"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '9999px',
          border: '1px solid #B6C2CC',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Logo slot on the left: empty rounded box */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-[#16A34A] rounded-lg"
          aria-label="40Labs Home"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#B6C2CC] bg-[#E4E9EC] transition-transform group-hover:scale-105"
            style={{ borderRadius: '12px' }}
          >
            <span className="font-heading font-bold text-sm text-[#1F2A33]">40</span>
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-[#1F2A33] hidden sm:inline">
            40Labs
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {companyNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-[#16A34A] focus:outline-none focus:underline"
                style={{
                  color: isActive ? '#16A34A' : '#4A5568',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Orange logIn button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-transform active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              borderRadius: '9999px',
            }}
          >
            logIn
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#F97316]"
          >
            logIn
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-[#1F2A33] hover:bg-black/5"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="w-full max-w-7xl mt-2 p-6 rounded-2xl bg-white border border-[#B6C2CC] shadow-xl md:hidden flex flex-col gap-4 animate-in fade-in duration-200">
          <nav className="flex flex-col gap-3">
            {companyNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-semibold py-2 px-3 rounded-lg text-[#1F2A33] hover:bg-[#E4E9EC]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

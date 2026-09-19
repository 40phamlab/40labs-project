"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { darkTokens } from '@40labs/design-tokens';
import { Button } from '@40labs/ui-components';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Services', href: '/services' },
  { label: 'Articles', href: '/articles' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full px-6 py-4 flex justify-center">
      <div
        className="w-full max-w-7xl h-16 px-8 flex items-center"
        style={{
          backgroundColor: darkTokens.colors.highlight,
          borderRadius: darkTokens.radius.pill,
          boxShadow: `${darkTokens.elevation.skeuOuter}, ${darkTokens.elevation.skeuInset}`,
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0 font-heading text-xl font-bold tracking-tight shrink-0">
          <span style={{ color: darkTokens.colors.accent }}>40</span>
          <span style={{ color: darkTokens.colors.text }}>Labs</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8 ml-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors duration-200"
                style={{
                  color: isActive ? darkTokens.colors.accent : darkTokens.colors.textMuted,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center ml-auto">
          <Button
            className="!h-10 !px-5 !text-sm !font-semibold"
            style={{
              backgroundColor: darkTokens.colors.bg,
              color: darkTokens.colors.text,
              borderRadius: darkTokens.radius.pill,
              border: 'none',
            }}
            onClick={() => {}}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}

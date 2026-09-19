"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';
import { Button, IconButton } from '@40labs/ui-components';
import { AppLauncherMenu } from './app-launcher-menu';

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
        className="w-full max-w-7xl h-16 px-6 flex items-center justify-between"
        style={{
          backgroundColor: darkTokens.colors.highlight,
          borderRadius: darkTokens.radius.pill,
          boxShadow: `${darkTokens.elevation.skeuOuter}, ${darkTokens.elevation.skeuInset}`,
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0 font-heading text-xl font-bold tracking-tight">
          <span style={{ color: darkTokens.colors.accent }}>40</span>
          <span style={{ color: darkTokens.colors.text }}>Labs</span>
        </Link>

        {/* Nav Links & Actions Group */}
        <div className="hidden md:flex items-center">
          <nav className="flex items-center gap-8">
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
          <div className="flex items-center gap-3 ml-8">
            <IconButton
              icon={<Search size={18} />}
              label="Search"
              intent="ghost"
              style={{ color: darkTokens.colors.text }}
            />
            <AppLauncherMenu />
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
      </div>
    </header>
  );
}

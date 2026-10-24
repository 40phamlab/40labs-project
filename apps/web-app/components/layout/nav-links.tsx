import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCompanyNavItems } from '@/mock-data/navigation';
import { darkTokens } from '@40labs/design-tokens';

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavLinksProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

export function NavLinks({ onNavigate, mobile = false }: NavLinksProps) {
  const pathname = usePathname();
  const items = getCompanyNavItems();

  if (mobile) {
    return (
      <nav className="flex flex-col gap-3">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="text-base font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-between"
              style={{
                color: active ? darkTokens.colors.accent : darkTokens.colors.text,
                backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex items-center gap-8 ml-8">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded px-1 outline-none"
            style={{
              color: active ? darkTokens.colors.accent : darkTokens.colors.textMuted,
              fontWeight: active ? 600 : 500,
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

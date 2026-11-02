"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { getCompanyNavItems, isNavActive } from '@/mock-data/navigation';
import { darkTokens } from '@40labs/design-tokens';
import { NavMegaMenu } from '@/components/nav/NavMegaMenu';

export { isNavActive };

interface NavLinksProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

export function NavLinks({ onNavigate, mobile = false }: NavLinksProps) {
  const pathname = usePathname();
  const items = getCompanyNavItems();
  const [productsOpen, setProductsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (productsOpen) {
      setProductsOpen(false);
    }
  }

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setProductsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) {
      timeoutRef.current = setTimeout(() => {
        setProductsOpen(false);
      }, 150);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setProductsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setProductsOpen(true);
    } else if (e.key === 'Escape') {
      setProductsOpen(false);
      triggerRef.current?.focus();
    }
  };

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
    <nav className="hidden md:flex items-center gap-6 ml-8 relative" onMouseLeave={handleMouseLeave}>
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        const isProducts = item.key === 'products';

        if (isProducts) {
          return (
            <div
              key={item.key}
              className="relative py-2"
              onMouseEnter={handleMouseEnter}
            >
              <button
                ref={triggerRef}
                id="products-nav-trigger"
                onClick={handleTriggerClick}
                onKeyDown={handleKeyDown}
                aria-expanded={productsOpen}
                aria-controls="products-mega-menu"
                className={`text-sm font-medium transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-lg px-2.5 py-1.5 outline-none inline-flex items-center gap-1.5 ${
                  productsOpen ? 'bg-white/5 text-white' : ''
                }`}
                style={{
                  color: active || productsOpen ? darkTokens.colors.accent : darkTokens.colors.textMuted,
                  fontWeight: active ? 600 : 500,
                }}
              >
                <span>{item.label}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <NavMegaMenu isOpen={productsOpen} onClose={() => setProductsOpen(false)} />
            </div>
          );
        }

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

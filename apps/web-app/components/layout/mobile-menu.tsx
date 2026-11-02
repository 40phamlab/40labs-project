"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronDown, ArrowUpRight } from 'lucide-react';
import { getCompanyNavItems, isNavActive } from '@/mock-data/navigation';
import { navProductColumns } from '@/navProducts';
import { StatusBadge } from '@/components/nav/StatusBadge';
import { LoginButton } from './login-button';
import { darkTokens } from '@40labs/design-tokens';
import { IconButton } from '@40labs/ui-components';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const items = getCompanyNavItems();
  const [productsExpanded, setProductsExpanded] = useState(false);

  // Close on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isOpen) {
      onClose();
    }
  }

  // Body scroll lock and Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end"
      onClick={onClose}
    >
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        className="w-full sm:max-w-md h-[100svh] p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto"
        style={{
          backgroundColor: '#121815',
          color: darkTokens.colors.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-6 border-b border-white/10 shrink-0">
          <span className="font-heading font-bold text-lg text-[#16A34A]">
            40<span className="text-white">Labs</span>
          </span>
          <IconButton
            icon={<X size={22} />}
            label="Close Menu"
            intent="ghost"
            onClick={onClose}
            className="!w-10 !h-10 text-white min-h-[44px] min-w-[44px]"
          />
        </div>

        <div className="py-6 flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            const isProducts = item.key === 'products';

            if (isProducts) {
              return (
                <div key={item.key} className="flex flex-col">
                  <button
                    onClick={() => setProductsExpanded(!productsExpanded)}
                    aria-expanded={productsExpanded}
                    className="text-base font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-between text-white hover:bg-white/5 min-h-[44px]"
                  >
                    <span>{item.label}</span>
                    <ChevronDown size={18} className={`transition-transform duration-200 ${productsExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {productsExpanded && (
                    <div className="flex flex-col gap-6 pl-4 pt-2 pb-3 border-l border-white/10 ml-4 my-2">
                      {navProductColumns.map((col) => (
                        <div key={col.title} className="flex flex-col gap-3">
                          <span className="font-mono text-xs uppercase tracking-widest text-gray-400 font-medium">
                            {col.title}
                          </span>
                          <div className="flex flex-col gap-2.5">
                            {col.items.map((subItem) => (
                              subItem.external ? (
                                <a
                                  key={subItem.title}
                                  href={subItem.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={onClose}
                                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 min-h-[44px]"
                                >
                                  <span className="inline-flex items-center gap-1.5 font-medium">
                                    {subItem.title}
                                    <ArrowUpRight size={13} className="opacity-60" />
                                  </span>
                                  {subItem.badge && <StatusBadge status={subItem.badge} />}
                                </a>
                              ) : (
                                <Link
                                  key={subItem.title}
                                  href={subItem.href}
                                  onClick={onClose}
                                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 min-h-[44px]"
                                >
                                  <span className="font-medium">{subItem.title}</span>
                                  {subItem.badge && <StatusBadge status={subItem.badge} />}
                                </Link>
                              )
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="text-base font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-between min-h-[44px]"
                style={{
                  color: active ? '#16A34A' : '#F8FAFB',
                  backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="pt-6 border-t border-white/10 shrink-0">
          <LoginButton onClick={onClose} mobile />
        </div>
      </div>
    </div>
  );
}

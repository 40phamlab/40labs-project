"use client";

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { NavLinks } from './nav-links';
import { LoginButton } from './login-button';
import { darkTokens } from '@40labs/design-tokens';
import { IconButton } from '@40labs/ui-components';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex justify-end"
      onClick={onClose}
    >
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        className="w-4/5 max-w-sm h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
        style={{
          backgroundColor: darkTokens.colors.topChrome,
          color: darkTokens.colors.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <span className="font-heading font-bold text-lg" style={{ color: darkTokens.colors.accent }}>
            40<span style={{ color: darkTokens.colors.text }}>Labs</span>
          </span>
          <IconButton
            icon={<X size={22} />}
            label="Close Menu"
            intent="ghost"
            onClick={onClose}
            className="!w-10 !h-10 text-white"
          />
        </div>

        <div className="py-6 flex-1 overflow-y-auto">
          <NavLinks onNavigate={onClose} mobile />
        </div>

        <div className="pt-6 border-t border-white/10">
          <LoginButton onClick={onClose} mobile />
        </div>
      </div>
    </div>
  );
}

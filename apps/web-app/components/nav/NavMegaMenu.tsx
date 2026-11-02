"use client";

import React, { useRef, useEffect } from 'react';
import { navProductColumns } from '@/navProducts';
import { NavMegaMenuColumn } from './NavMegaMenuColumn';

interface NavMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
}

export function NavMegaMenu({ isOpen, onClose, id = 'products-mega-menu' }: NavMegaMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if click was on the trigger button (handled by trigger click handler)
        const triggerBtn = document.getElementById('products-nav-trigger');
        if (triggerBtn && triggerBtn.contains(e.target as Node)) {
          return;
        }
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id={id}
      ref={menuRef}
      className="absolute top-full left-0 right-0 pt-3 z-50 animate-in fade-in slide-in-from-top-1.5 duration-180 ease-out"
      style={{
        animationDuration: '180ms',
      }}
    >
      <div
        className="w-full max-w-7xl mx-auto rounded-2xl bg-[#121815]/95 backdrop-blur-md border border-white/10 p-8 shadow-2xl"
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {navProductColumns.map((col) => (
            <NavMegaMenuColumn key={col.title} column={col} onSelect={onClose} />
          ))}
        </div>
      </div>
    </div>
  );
}

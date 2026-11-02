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

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
      className="absolute top-full left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] max-w-7xl mt-3 z-50 hidden lg:block animate-in fade-in slide-in-from-top-1.5 duration-180 ease-out"
      style={{
        animationDuration: '180ms',
      }}
    >
      {/* Transparent hover bridge */}
      <div className="absolute -top-3 h-3 w-full" aria-hidden="true" />

      <div
        className="w-full rounded-2xl bg-[#0e1413]/95 backdrop-blur-xl border border-white/10 p-6 sm:p-8 xl:p-10 shadow-2xl max-h-[min(70vh,640px)] overflow-y-auto"
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div className="grid grid-cols-12 gap-x-6 xl:gap-x-10 gap-y-8">
          {navProductColumns.map((col, index) => {
            const isPlatform = index === 0;
            const spanClass = isPlatform ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-3';
            return (
              <div key={col.title} className={spanClass}>
                <NavMegaMenuColumn column={col} onSelect={onClose} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

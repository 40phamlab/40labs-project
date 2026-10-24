"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';

interface HeroCardCtaProps {
  label: string;
  tone: 'orange' | 'green' | 'white';
  onClick?: () => void;
}

export function HeroCardCta({ label, tone, onClick }: HeroCardCtaProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // No network calls of any kind - stub only
    console.log(`Hero CTA clicked: ${label} (${tone})`);
    if (onClick) onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="web-pill px-6 py-3 text-sm font-bold flex items-center justify-between gap-3 shadow-lg transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] outline-none"
      style={{
        backgroundColor: '#1F2A33',
        color: '#F8FAFB',
        borderRadius: darkTokens.radius.pill,
      }}
    >
      <span>{label}</span>
      <ArrowRight size={16} />
    </button>
  );
}

import React from 'react';
import Link from 'next/link';
import { darkTokens } from '@40labs/design-tokens';

export function LogoSlot() {
  return (
    <Link
      href="/"
      className="flex items-center gap-0 font-heading text-xl font-bold tracking-tight shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-lg outline-none"
    >
      <span style={{ color: darkTokens.colors.accent }}>40</span>
      <span style={{ color: darkTokens.colors.text }}>Labs</span>
    </Link>
  );
}

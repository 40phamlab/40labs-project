"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';

export function HeroSearch() {
  return (
    <section className="w-full flex flex-col items-center pt-24 pb-16 px-6">
      {/* Wordmark */}
      <div className="flex items-center gap-0 font-heading text-7xl md:text-9xl font-bold tracking-tighter mb-12">
        <span style={{ color: darkTokens.colors.accent }}>40</span>
        <span style={{ color: darkTokens.colors.text }}>Labs</span>
      </div>

      {/* Pill Search Input */}
      <div className="w-full max-w-2xl relative group">
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2"
          style={{ color: darkTokens.colors.textMuted }}
        >
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="search..."
          disabled
          className="w-full h-16 pl-14 pr-6 text-sm transition-all cursor-not-allowed"
          style={{
            backgroundColor: darkTokens.colors.bg,
            color: darkTokens.colors.text,
            borderRadius: darkTokens.radius.pill,
            border: `1px solid ${darkTokens.colors.highlight}33`,
            boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5)`,
          }}
        />
      </div>

      {/* Language Access */}
      <p
        className="mt-6 text-xs tracking-wide uppercase"
        style={{ color: darkTokens.colors.textMuted }}
      >
        Access via: <span className="font-semibold" style={{ color: darkTokens.colors.text }}>Swahili</span>
      </p>
    </section>
  );
}

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
          className="absolute left-8 top-1/2 -translate-y-1/2"
          style={{ color: darkTokens.colors.textMuted }}
        >
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="search..."
          disabled
          className="w-full h-16 pl-[72px] pr-8 text-sm transition-all cursor-not-allowed"
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

      {/* Tool Pills */}
      <div className="flex flex-col items-center mt-20">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 opacity-40" style={{ color: darkTokens.colors.text }}>
          Get Best Of Our Tools
        </p>
        <div className="flex items-center gap-4">
          {[
            { name: '40LabsCore', href: '#' },
            { name: 'vLabs', href: '#' },
            { name: 'aDesk', href: '#' },
          ].map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              className="h-11 px-6 flex items-center justify-center text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: darkTokens.colors.highlight,
                color: darkTokens.colors.text,
                borderRadius: darkTokens.radius.pill,
                boxShadow: darkTokens.elevation.skeuOuter,
              }}
            >
              {tool.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

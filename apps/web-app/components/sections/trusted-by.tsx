"use client";

import React from 'react';
import { darkTokens } from '@40labs/design-tokens';
import { getTrustedPartners } from '@/mock-data/trusted-partners';

export function TrustedBy() {
  const partners = getTrustedPartners();
  // Duplicate the list for seamless looping
  const marqueeItems = [...partners, ...partners];

  return (
    <section className="w-full py-20 overflow-hidden flex flex-col items-center gap-12">
      <h2
        className="text-lg font-heading font-bold uppercase tracking-widest opacity-60"
        style={{ color: darkTokens.colors.text }}
      >
        Trusted By
      </h2>

      <div className="w-full relative">
        {/* Gradient Mask for smooth fade edges */}
        <div
          className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to right, ${darkTokens.colors.bg}, transparent)` }}
        />
        <div
          className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to left, ${darkTokens.colors.bg}, transparent)` }}
        />

        <div className="flex w-max animate-marquee gap-8 px-4">
          {marqueeItems.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="w-48 h-28 flex items-center justify-center p-4"
              style={{
                backgroundColor: darkTokens.colors.bg,
                borderRadius: darkTokens.radius.card,
                border: `1px solid rgba(255,255,255,0.1)`,
                boxShadow: darkTokens.elevation.skeuOuter,
              }}
            >
              {/* Placeholder for partner logo */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full opacity-30"
                  style={{ backgroundColor: darkTokens.colors.highlight }}
                />
                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-40" style={{ color: darkTokens.colors.text }}>
                  {partner.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import React from 'react';
import { darkTokens } from '@40labs/design-tokens';
import { getTrustedPartners } from '@/mock-data/trusted-partners';

export function TrustedBy() {
  const partners = getTrustedPartners();

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-20 flex flex-col items-center gap-12">
      <h2
        className="text-lg font-heading font-bold uppercase tracking-widest opacity-60"
        style={{ color: darkTokens.colors.text }}
      >
        Trusted By
      </h2>

      <div className="flex items-center justify-center -space-x-8">
        {partners.map((partner, index) => (
          <div
            key={partner.id}
            className="w-48 h-28 flex items-center justify-center p-4 transition-transform hover:-translate-y-2"
            style={{
              backgroundColor: darkTokens.colors.bg,
              borderRadius: darkTokens.radius.card,
              border: `1px solid rgba(255,255,255,0.1)`,
              boxShadow: darkTokens.elevation.skeuOuter,
              zIndex: partners.length - index,
            }}
          >
            {/* Placeholder for partner logo */}
            <div
              className="w-12 h-12 rounded-full opacity-20"
              style={{ backgroundColor: darkTokens.colors.highlight }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

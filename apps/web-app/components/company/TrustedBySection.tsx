"use client";

import React from 'react';
import Image from 'next/image';
import { darkTokens } from '@40labs/design-tokens';
import { getTrustedPartners, Partner } from '@/mock-data/trusted-partners';

interface TrustedBySectionProps {
  partners?: Partner[];
}

export function TrustedBySection({ partners }: TrustedBySectionProps) {
  const allPartners = partners !== undefined ? partners : getTrustedPartners();

  // Ensure exactly 4 slots
  const slots: (Partner | null)[] = [];
  for (let i = 0; i < 4; i++) {
    slots.push(allPartners[i] || null);
  }

  return (
    <section data-scene-step className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 flex flex-col items-center gap-12 relative z-10">
      <h2
        className="font-heading font-bold text-sm uppercase tracking-widest text-[#55636E]"
        style={{ color: darkTokens.colors.text }}
      >
        Trusted By
      </h2>

      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6">
        {slots.map((partner, index) => (
          <div
            key={partner?.id || `empty-slot-${index}`}
            className="h-24 rounded-[16px] border border-[#B6C2CC]/40 bg-[#1A221E] flex items-center justify-center shadow-sm relative overflow-hidden web-card"
            style={{
              borderRadius: darkTokens.radius.card,
              backgroundColor: '#1A221E',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {partner?.logoUrl ? (
              <Image
                src={partner.logoUrl}
                alt={partner.name || 'Partner logo'}
                width={120}
                height={40}
                className="max-h-12 w-auto object-contain"
                unoptimized
              />
            ) : (
              /* Decorative empty outlined slot - no fake company names */
              <div className="w-full h-full flex items-center justify-center" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export const TrustedBy = TrustedBySection;

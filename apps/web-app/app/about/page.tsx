import React from 'react';
import { darkTokens } from '@40labs/design-tokens';
import { PlaceholderBlock } from '@/components/sections/placeholder-block';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-16">
      <h1 className="text-4xl font-heading font-bold">About 40Labs</h1>

      <PlaceholderBlock title="Our Mission & Story" />

      {/* Related Section */}
      <div className="flex flex-col gap-8">
        <h2 className="text-xl font-heading font-bold opacity-60">Related</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Partners', 'Careers', 'Press'].map((label) => (
            <div
              key={label}
              className="h-32 flex items-center justify-center border border-white/10"
              style={{
                backgroundColor: `${darkTokens.colors.bg}`,
                borderRadius: darkTokens.radius.card,
                boxShadow: darkTokens.elevation.skeuOuter,
              }}
            >
              <span
                className="font-heading text-sm font-bold uppercase tracking-widest opacity-40"
                style={{ color: darkTokens.colors.text }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

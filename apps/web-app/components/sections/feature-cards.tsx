"use client";

import React from 'react';
import { darkTokens } from '@40labs/design-tokens';
import { getFeatureCards } from '@/mock-data/feature-cards';

export function FeatureCards() {
  const cards = getFeatureCards();

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="h-48 flex items-center justify-center p-8 transition-transform hover:scale-[1.02] cursor-default"
            style={{
              backgroundColor: darkTokens.colors.highlight,
              borderRadius: darkTokens.radius.card,
              boxShadow: `${darkTokens.elevation.skeuOuter}, ${darkTokens.elevation.skeuInset}`,
            }}
          >
            <h3 className="text-xl font-heading font-bold text-center text-white">
              {card.label}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}

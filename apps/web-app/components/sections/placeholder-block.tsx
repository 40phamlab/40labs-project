"use client";

import React from 'react';
import { darkTokens } from '@40labs/design-tokens';

interface PlaceholderBlockProps {
  title?: string;
}

export function PlaceholderBlock({ title = "More Coming Soon" }: PlaceholderBlockProps) {
  return (
    <div
      className="w-full h-96 flex flex-col items-center justify-center border-2 border-dashed border-white/5 opacity-40"
      style={{
        backgroundColor: `${darkTokens.colors.highlight}08`,
        borderRadius: darkTokens.radius.card,
      }}
    >
      <p
        className="font-heading text-lg font-medium tracking-wide uppercase"
        style={{ color: darkTokens.colors.text }}
      >
        {title}
      </p>
    </div>
  );
}

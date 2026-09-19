"use client";

import React from 'react';
import { darkTokens } from '@40labs/design-tokens';
import { getTools } from '@/mock-data/tools';

export function ToolsShowcase() {
  const tools = getTools();

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-20 flex flex-col items-center gap-10">
      <h2
        className="text-2xl font-heading font-bold"
        style={{ color: darkTokens.colors.text }}
      >
        Get Best Of Our Tools
      </h2>

      <div className="flex flex-wrap justify-center gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className="px-10 py-3 text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: darkTokens.colors.bg,
              borderRadius: darkTokens.radius.pill,
              border: `2px solid ${darkTokens.colors.highlight}`,
              boxShadow: darkTokens.elevation.skeuOuter,
            }}
          >
            <span style={{ color: darkTokens.colors.accent }}>{tool.name[0]}</span>
            <span style={{ color: darkTokens.colors.text }}>{tool.name.slice(1)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

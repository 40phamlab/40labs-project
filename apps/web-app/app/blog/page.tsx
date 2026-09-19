import React from 'react';
import { Search, Filter } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';
import { PlaceholderBlock } from '@/components/sections/placeholder-block';

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-12">
      <h1 className="text-4xl font-heading font-bold">Health Blog</h1>

      {/* Blog Filter Pill Bar */}
      <div
        className="w-full h-16 px-6 flex items-center justify-between"
        style={{
          backgroundColor: darkTokens.colors.highlight,
          borderRadius: darkTokens.radius.pill,
          boxShadow: `${darkTokens.elevation.skeuOuter}, ${darkTokens.elevation.skeuInset}`,
        }}
      >
        <div className="flex items-center gap-4 text-white/70">
          <Search size={18} />
          <span className="text-sm">Search articles...</span>
        </div>

        <div className="flex items-center gap-6">
          {['All', 'Medical', 'Tech', 'Research'].map((cat, i) => (
            <span
              key={cat}
              className={`text-sm ${i === 0 ? 'text-white font-bold' : 'text-white/60'}`}
            >
              {cat}
            </span>
          ))}
          <div className="h-6 w-px bg-white/20 mx-2" />
          <Filter size={18} className="text-white/70" />
        </div>
      </div>

      <PlaceholderBlock title="Articles & Insights Coming Soon" />
    </div>
  );
}
